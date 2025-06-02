"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  IconArrowLeft, 
  IconEdit, 
  IconUsers, 
  IconBuilding,
  IconStar,
  IconCalendar,
  IconPlus,
  IconTrash,
  IconEye,
  IconSettings,
  IconUserPlus,
  IconBuildingPlus,
  IconChartBar,
  IconDeviceFloppy,
  IconSearch
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type CandidatePool = {
  id: string;
  name: string;
  description?: string;
  pool_type: "main" | "custom" | "featured" | "premium";
  status: "active" | "inactive" | "archived";
  candidate_count: number;
  max_candidates?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  visibility: "public" | "private" | "restricted";
  created_by_name?: string;
};

type PoolCandidate = {
  id: string;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  skills: string[];
  assigned_at: string;
  assigned_by_name: string;
  priority: number;
  featured: boolean;
  notes?: string;
  selection_count: number;
};

type CompanyAccess = {
  id: string;
  company_id: string;
  company_name: string;
  access_level: "view" | "select" | "contact";
  assigned_at: string;
  assigned_by_name: string;
  expires_at?: string;
  notes?: string;
  selection_count: number;
};

type PoolStats = {
  totalCandidates: number;
  activeCandidates: number;
  featuredCandidates: number;
  companiesWithAccess: number;
  totalSelections: number;
  selectionsThisMonth: number;
  averageRating: number;
  topSkills: { skill: string; count: number }[];
};

export default function PoolDetailPage() {
  const params = useParams();
  const poolId = params.id as string;
  const [pool, setPool] = useState<CandidatePool | null>(null);
  const [candidates, setCandidates] = useState<PoolCandidate[]>([]);
  const [companies, setCompanies] = useState<CompanyAccess[]>([]);
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPool, setEditingPool] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [addingCandidates, setAddingCandidates] = useState(false);
  const [availableCandidates, setAvailableCandidates] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    skills: string[];
    isInPool: boolean;
  }[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
  const [addCandidateForm, setAddCandidateForm] = useState({
    priority: 0,
    featured: false,
    notes: ""
  });
  const [addingCompanies, setAddingCompanies] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<{
    id: string;
    company_name: string;
    industry?: string;
    location?: string;
    hasAccess: boolean;
  }[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [addCompanyForm, setAddCompanyForm] = useState({
    access_level: "view" as "view" | "select" | "contact",
    expires_at: "",
    notes: ""
  });
  const [editingCompanyAccess, setEditingCompanyAccess] = useState<CompanyAccess | null>(null);
  const [editCompanyForm, setEditCompanyForm] = useState({
    access_level: "view" as "view" | "select" | "contact",
    expires_at: "",
    notes: ""
  });
  const supabase = createClient();

  // Form states for editing
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    max_candidates: "",
    visibility: "public",
    pool_type: "main" as "main" | "custom" | "featured" | "premium",
    status: "active" as "active" | "inactive" | "archived",
    tags: [] as string[]
  });

  useEffect(() => {
    if (poolId) {
      loadPoolData();
    }
  }, [poolId]);

  async function loadPoolData() {
    try {
      setLoading(true);

      // Load pool details
      const { data: poolData, error: poolError } = await supabase
        .from("candidate_pools")
        .select("*")
        .eq("id", poolId)
        .single();

      if (poolError) throw poolError;

      if (poolData) {
        // Get the creator name based on their role
        let created_by_name = "Unbekannt";
        if (poolData.created_by) {
          // First check if it's a candidate
          const { data: candidateData } = await supabase
            .from("candidates")
            .select("first_name, last_name")
            .eq("id", poolData.created_by)
            .single();

          if (candidateData) {
            created_by_name = `${candidateData.first_name} ${candidateData.last_name}`;
          } else {
            // Check if it's a company
            const { data: companyData } = await supabase
              .from("companies")
              .select("contact_name")
              .eq("id", poolData.created_by)
              .single();

            if (companyData) {
              created_by_name = companyData.contact_name || "Unternehmen";
            } else {
              // Must be admin
              created_by_name = "Administrator";
            }
          }
        }

        const enrichedPool: CandidatePool = {
          ...poolData,
          created_by_name,
          tags: Array.isArray(poolData.tags) ? poolData.tags : []
        };
        
        setPool(enrichedPool);
        setEditForm({
          name: enrichedPool.name,
          description: enrichedPool.description || "",
          max_candidates: enrichedPool.max_candidates?.toString() || "",
          visibility: enrichedPool.visibility,
          pool_type: enrichedPool.pool_type,
          status: enrichedPool.status,
          tags: enrichedPool.tags
        });

        // Load pool candidates
        await loadCandidates();
        
        // Load company access
        await loadCompanyAccess();
        
        // Load statistics
        await loadStats();
      }
    } catch (error) {
      console.error("Error loading pool data:", error);
      toast.error("Fehler beim Laden der Pool-Daten");
    } finally {
      setLoading(false);
    }
  }

  async function loadCandidates() {
    const { data, error } = await supabase
      .from("pool_candidates")
      .select(`
        *,
        candidate:candidates(
          id,
          first_name,
          last_name,
          email,
          skills
        )
      `)
      .eq("pool_id", poolId)
      .order("priority", { ascending: false });

    if (error) throw error;

    if (data) {
      const enrichedCandidates = await Promise.all(
        data.map(async (assignment) => {
          // Get selection count for this candidate in this pool
          const { count: selectionCount } = await supabase
            .from("candidate_selections")
            .select("*", { count: "exact", head: true })
            .eq("candidate_id", assignment.candidate_id)
            .eq("pool_id", poolId);

          // Get the name of who added this assignment
          let assigned_by_name = "Unbekannt";
          if (assignment.added_by) {
            // First check if it's a candidate
            const { data: candidateData } = await supabase
              .from("candidates")
              .select("first_name, last_name")
              .eq("id", assignment.added_by)
              .single();

            if (candidateData) {
              assigned_by_name = `${candidateData.first_name} ${candidateData.last_name}`;
            } else {
              // Check if it's a company
              const { data: companyData } = await supabase
                .from("companies")
                .select("contact_name")
                .eq("id", assignment.added_by)
                .single();

              if (companyData) {
                assigned_by_name = companyData.contact_name || "Unternehmen";
              } else {
                // Must be admin
                assigned_by_name = "Administrator";
              }
            }
          }

          return {
            id: assignment.id,
            candidate_id: assignment.candidate_id,
            first_name: assignment.candidate?.first_name || "",
            last_name: assignment.candidate?.last_name || "",
            email: assignment.candidate?.email || "",
            position: undefined,
            skills: Array.isArray(assignment.candidate?.skills) ? assignment.candidate.skills : [],
            assigned_at: assignment.added_at,
            assigned_by_name,
            priority: assignment.priority,
            featured: assignment.featured,
            status: "active", // pool_candidates doesn't have status field, defaulting to active
            notes: assignment.notes,
            selection_count: selectionCount || 0
          } as PoolCandidate;
        })
      );

      setCandidates(enrichedCandidates);
    }
  }

  async function loadCompanyAccess() {
    const { data, error } = await supabase
      .from("pool_company_access")
      .select(`
        *,
        company:companies(
          name
        )
      `)
      .eq("pool_id", poolId)
      .order("granted_at", { ascending: false });

    if (error) throw error;

    if (data) {
      const enrichedCompanies = await Promise.all(
        data.map(async (access) => {
          // Get selection count for this company in this pool
          const { count: selectionCount } = await supabase
            .from("candidate_selections")
            .select("*", { count: "exact", head: true })
            .eq("company_id", access.company_id)
            .eq("pool_id", poolId);

          // Get the name of who granted this access
          let assigned_by_name = "Unbekannt";
          if (access.granted_by) {
            // First check if it's a candidate
            const { data: candidateData } = await supabase
              .from("candidates")
              .select("first_name, last_name")
              .eq("id", access.granted_by)
              .single();

            if (candidateData) {
              assigned_by_name = `${candidateData.first_name} ${candidateData.last_name}`;
            } else {
              // Check if it's a company
              const { data: companyData } = await supabase
                .from("companies")
                .select("contact_name")
                .eq("id", access.granted_by)
                .single();

              if (companyData) {
                assigned_by_name = companyData.contact_name || "Unternehmen";
              } else {
                // Must be admin
                assigned_by_name = "Administrator";
              }
            }
          }

          return {
            id: access.id,
            company_id: access.company_id,
            company_name: access.company?.name || "Unbekannt",
            access_level: access.access_level,
            assigned_at: access.granted_at,
            assigned_by_name,
            expires_at: access.expires_at,
            notes: access.notes,
            selection_count: selectionCount || 0
          } as CompanyAccess;
        })
      );

      setCompanies(enrichedCompanies);
    }
  }

  async function loadStats() {
    try {
      // Get basic stats using direct queries instead of the faulty RPC function
      
      // Get total candidates count
      const { count: totalCandidates } = await supabase
        .from("pool_candidates")
        .select("*", { count: "exact", head: true })
        .eq("pool_id", poolId);

      // Get active candidates count (assuming all are active since there's no status field)
      const activeCandidates = totalCandidates || 0;

      // Get featured candidates count
      const { count: featuredCandidates } = await supabase
        .from("pool_candidates")
        .select("*", { count: "exact", head: true })
        .eq("pool_id", poolId)
        .eq("featured", true);

      // Get companies with access count
      const { count: companiesWithAccess } = await supabase
        .from("pool_company_access")
        .select("*", { count: "exact", head: true })
        .eq("pool_id", poolId);

      // Get total selections count
      const { count: totalSelections } = await supabase
        .from("candidate_selections")
        .select("*", { count: "exact", head: true })
        .eq("pool_id", poolId);

      // Get selections this month using created_at instead of selected_at
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const { count: selectionsThisMonth } = await supabase
        .from("candidate_selections")
        .select("*", { count: "exact", head: true })
        .eq("pool_id", poolId)
        .gte("created_at", oneMonthAgo.toISOString());

      // No average rating since the table doesn't have a rating column
      const averageRating = 0;

      // Get top skills from candidates in this pool
      const { data: skillsData } = await supabase
        .from("pool_candidates")
        .select(`
          candidate:candidates(skills)
        `)
        .eq("pool_id", poolId);

      const skillCounts: { [key: string]: number } = {};
      if (skillsData) {
        skillsData.forEach((assignment: any) => {
          const skills = assignment.candidate?.skills;
          if (Array.isArray(skills)) {
            skills.forEach((skill: string) => {
              skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
          }
        });
      }

      const topSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats({
        totalCandidates: totalCandidates || 0,
        activeCandidates: activeCandidates,
        featuredCandidates: featuredCandidates || 0,
        companiesWithAccess: companiesWithAccess || 0,
        totalSelections: totalSelections || 0,
        selectionsThisMonth: selectionsThisMonth || 0,
        averageRating,
        topSkills
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadAvailableCandidates() {
    try {
      // Get all candidates
      const { data: allCandidates, error: candidatesError } = await supabase
        .from("candidates")
        .select("id, first_name, last_name, email, skills")
        .order("first_name");

      if (candidatesError) throw candidatesError;

      if (allCandidates) {
        // Get candidates already in this pool
        const { data: poolCandidates, error: poolError } = await supabase
          .from("pool_candidates")
          .select("candidate_id")
          .eq("pool_id", poolId);

        if (poolError) throw poolError;

        const candidatesInPool = new Set(poolCandidates?.map(pc => pc.candidate_id) || []);

        const enrichedCandidates = allCandidates.map(candidate => ({
          ...candidate,
          skills: Array.isArray(candidate.skills) ? candidate.skills : [],
          isInPool: candidatesInPool.has(candidate.id)
        }));

        setAvailableCandidates(enrichedCandidates);
      }
    } catch (error) {
      console.error("Error loading available candidates:", error);
      toast.error("Fehler beim Laden der verfügbaren Kandidaten");
    }
  }

  async function loadAvailableCompanies() {
    try {
      // Get all companies - only select existing columns
      const { data: allCompanies, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, website, contact_name")
        .order("name");

      if (companiesError) throw companiesError;

      if (allCompanies) {
        // Get companies that already have access to this pool
        const { data: poolCompanies, error: poolError } = await supabase
          .from("pool_company_access")
          .select("company_id")
          .eq("pool_id", poolId);

        if (poolError) throw poolError;

        const companiesWithAccess = new Set(poolCompanies?.map(pc => pc.company_id) || []);

        const enrichedCompanies = allCompanies.map(company => ({
          ...company,
          company_name: company.name,
          industry: company.contact_name || "Unbekannt", // Use contact_name as fallback
          location: company.website || "", // Use website as fallback or empty string
          hasAccess: companiesWithAccess.has(company.id)
        }));

        setAvailableCompanies(enrichedCompanies);
      }
    } catch (error) {
      console.error("Error loading available companies:", error);
      toast.error("Fehler beim Laden der verfügbaren Unternehmen");
    }
  }

  async function handleSavePool() {
    try {
      // ✅ Validation: Check if new max_candidates limit would be exceeded
      const newMaxCandidates = editForm.max_candidates ? parseInt(editForm.max_candidates) : null;
      if (newMaxCandidates && newMaxCandidates < candidates.length) {
        toast.error(
          `Fehler: Neues Limit (${newMaxCandidates}) ist kleiner als die aktuelle Anzahl von Kandidaten (${candidates.length}). ` +
          `Bitte entfernen Sie erst Kandidaten oder erhöhen Sie das Limit.`
        );
        return;
      }

      // ✅ Validation: Name cannot be empty
      if (!editForm.name.trim()) {
        toast.error("Pool-Name darf nicht leer sein");
        return;
      }

      const { error } = await supabase
        .from("candidate_pools")
        .update({
          name: editForm.name.trim(),
          description: editForm.description?.trim() || null,
          max_candidates: newMaxCandidates,
          visibility: editForm.visibility,
          pool_type: editForm.pool_type,
          status: editForm.status,
          tags: editForm.tags,
          updated_at: new Date().toISOString()
        })
        .eq("id", poolId);

      if (error) throw error;

      toast.success("Pool erfolgreich aktualisiert");
      setEditingPool(false);
      loadPoolData();
    } catch (error) {
      console.error("Error updating pool:", error);
      toast.error("Fehler beim Aktualisieren des Pools");
    }
  }

  async function handleRemoveCandidate(assignmentId: string) {
    if (!window.confirm("Möchten Sie diesen Kandidaten aus dem Pool entfernen?")) return;

    try {
      const { error } = await supabase
        .from("pool_candidates")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Kandidat aus Pool entfernt");
      loadCandidates();
    } catch (error) {
      console.error("Error removing candidate:", error);
      toast.error("Fehler beim Entfernen des Kandidaten");
    }
  }

  async function handleToggleFeatured(assignmentId: string, featured: boolean) {
    try {
      const { error } = await supabase
        .from("pool_candidates")
        .update({ featured: !featured })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(featured ? "Featured-Status entfernt" : "Als Featured markiert");
      loadCandidates();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast.error("Fehler beim Ändern des Featured-Status");
    }
  }

  async function handleAddCandidates() {
    if (selectedCandidates.size === 0) {
      toast.error("Bitte wählen Sie mindestens einen Kandidaten aus");
      return;
    }

    if (pool?.max_candidates) {
      const currentCandidates = candidates.length;
      const newCandidates = selectedCandidates.size;
      const totalAfterAdding = currentCandidates + newCandidates;
      
      if (totalAfterAdding > pool.max_candidates) {
        const availableSlots = pool.max_candidates - currentCandidates;
        toast.error(
          `Pool-Limit erreicht! Maximal ${pool.max_candidates} Kandidaten erlaubt. ` +
          `Aktuell: ${currentCandidates}, Verfügbare Plätze: ${availableSlots}, ` +
          `Versucht hinzuzufügen: ${newCandidates}`
        );
        return;
      }
      
      if (totalAfterAdding > pool.max_candidates * 0.8) {
        const remaining = pool.max_candidates - totalAfterAdding;
        toast.warning(
          `Achtung: Pool ist fast voll! Nach dem Hinzufügen sind noch ${remaining} Plätze verfügbar.`
        );
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Benutzer nicht authentifiziert");
        return;
      }

      const assignments = Array.from(selectedCandidates).map(candidateId => ({
        pool_id: poolId,
        candidate_id: candidateId,
        added_by: user.id,
        priority: addCandidateForm.priority,
        featured: addCandidateForm.featured,
        notes: addCandidateForm.notes || null
      }));

      const { error } = await supabase
        .from("pool_candidates")
        .insert(assignments);

      if (error) throw error;

      toast.success(`${selectedCandidates.size} Kandidat(en) erfolgreich zum Pool hinzugefügt`);
      
      setSelectedCandidates(new Set());
      setAddCandidateForm({
        priority: 0,
        featured: false,
        notes: ""
      });
      setCandidateSearchTerm("");
      setAddingCandidates(false);
      
      loadCandidates();
      loadStats();
      
    } catch (error) {
      console.error("Error adding candidates:", error);
      toast.error("Fehler beim Hinzufügen der Kandidaten");
    }
  }

  function handleCandidateSelect(candidateId: string) {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  }

  function getFilteredAvailableCandidates() {
    return availableCandidates.filter(candidate => {
      if (candidate.isInPool) return false;
      if (!candidateSearchTerm) return true;
      
      const searchLower = candidateSearchTerm.toLowerCase();
      return (
        candidate.first_name.toLowerCase().includes(searchLower) ||
        candidate.last_name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    });
  }

  async function handleAddCompanies() {
    if (selectedCompanies.size === 0) {
      toast.error("Bitte wählen Sie mindestens ein Unternehmen aus");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Benutzer nicht authentifiziert");
        return;
      }

      const assignments = Array.from(selectedCompanies).map(companyId => ({
        pool_id: poolId,
        company_id: companyId,
        granted_by: user.id,
        access_level: addCompanyForm.access_level,
        expires_at: addCompanyForm.expires_at || null,
        notes: addCompanyForm.notes
      }));

      const { error } = await supabase
        .from("pool_company_access")
        .insert(assignments);

      if (error) throw error;

      toast.success(`${selectedCompanies.size} Unternehmen Zugriff gewährt`);
      setAddingCompanies(false);
      setSelectedCompanies(new Set());
      setAddCompanyForm({
        access_level: "view",
        expires_at: "",
        notes: ""
      });
      setCompanySearchTerm("");
      
      loadCompanyAccess();
      loadAvailableCompanies();
    } catch (error) {
      console.error("Error adding companies:", error);
      toast.error("Fehler beim Gewähren des Zugriffs");
    }
  }

  function handleCompanySelect(companyId: string) {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  }

  function getFilteredAvailableCompanies() {
    return availableCompanies.filter(company => {
      if (company.hasAccess) return false;
      if (!companySearchTerm) return true;
      
      const searchLower = companySearchTerm.toLowerCase();
      return (
        company.company_name.toLowerCase().includes(searchLower) ||
        company.industry?.toLowerCase().includes(searchLower) ||
        company.location?.toLowerCase().includes(searchLower)
      );
    });
  }

  function handleEditCompanyAccess(companyAccess: CompanyAccess) {
    setEditingCompanyAccess(companyAccess);
    setEditCompanyForm({
      access_level: companyAccess.access_level,
      expires_at: companyAccess.expires_at ? companyAccess.expires_at.split('T')[0] : "",
      notes: companyAccess.notes || ""
    });
  }

  async function handleUpdateCompanyAccess() {
    if (!editingCompanyAccess) return;

    try {
      const { error } = await supabase
        .from("pool_company_access")
        .update({
          access_level: editCompanyForm.access_level,
          expires_at: editCompanyForm.expires_at || null,
          notes: editCompanyForm.notes || null
        })
        .eq("id", editingCompanyAccess.id);

      if (error) throw error;

      toast.success("Zugriffsberechtigung erfolgreich aktualisiert");
      setEditingCompanyAccess(null);
      setEditCompanyForm({
        access_level: "view",
        expires_at: "",
        notes: ""
      });
      
      // Reload data
      loadCompanyAccess();
    } catch (error) {
      console.error("Error updating company access:", error);
      toast.error("Fehler beim Aktualisieren der Zugriffsberechtigung");
    }
  }

  async function handleRemoveCompanyAccess(accessId: string) {
    if (!window.confirm("Möchten Sie den Zugang für dieses Unternehmen entfernen?")) return;

    try {
      const { error } = await supabase
        .from("pool_company_access")
        .delete()
        .eq("id", accessId);

      if (error) throw error;

      toast.success("Unternehmenszugang entfernt");
      loadCompanyAccess();
      loadAvailableCompanies();
    } catch (error) {
      console.error("Error removing company access:", error);
      toast.error("Fehler beim Entfernen des Unternehmenszugangs");
    }
  }

  function getStatusBadge(status: "active" | "inactive" | "archived") {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Aktiv</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inaktiv</Badge>;
      case "archived":
        return <Badge variant="outline">Archiviert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getTypeBadge(type: CandidatePool["pool_type"]) {
    switch (type) {
      case "main":
        return <Badge variant="default" className="bg-blue-600">Hauptpool</Badge>;
      case "featured":
        return <Badge variant="default" className="bg-purple-600">Featured</Badge>;
      case "premium":
        return <Badge variant="default" className="bg-yellow-600">Premium</Badge>;
      case "custom":
        return <Badge variant="outline">Custom</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }

  function getAccessLevelBadge(level: "view" | "select" | "contact") {
    switch (level) {
      case "contact":
        return <Badge variant="default" className="bg-green-600">Kontaktieren</Badge>;
      case "select":
        return <Badge variant="default" className="bg-blue-600">Auswählen</Badge>;
      case "view":
        return <Badge variant="outline">Anzeigen</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  }

  const candidateColumns: ColumnDef<PoolCandidate>[] = [
    {
      accessorKey: "name",
      header: "Kandidat",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </span>
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
          {row.original.position && (
            <span className="text-xs text-muted-foreground">{row.original.position}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.skills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {row.original.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.skills.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priorität",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.priority}</span>
          {row.original.featured && (
            <IconStar className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "selection_count",
      header: "Auswahlen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconStar className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.selection_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "assigned_at",
      header: "Hinzugefügt",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {new Date(row.original.assigned_at).toLocaleDateString("de-DE")}
          </span>
          <span className="text-xs text-muted-foreground">
            von {row.original.assigned_by_name}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <IconSettings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleToggleFeatured(row.original.id, row.original.featured)}
            >
              <IconStar className="h-4 w-4 mr-2" />
              {row.original.featured ? "Featured entfernen" : "Als Featured markieren"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleRemoveCandidate(row.original.id)}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Aus Pool entfernen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const companyColumns: ColumnDef<CompanyAccess>[] = [
    {
      accessorKey: "company_name",
      header: "Unternehmen",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.company_name}</span>
      ),
    },
    {
      accessorKey: "access_level",
      header: "Zugriffslevel",
      cell: ({ row }) => getAccessLevelBadge(row.original.access_level),
    },
    {
      accessorKey: "selection_count",
      header: "Auswahlen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconStar className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.selection_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "assigned_at",
      header: "Zugewiesenen",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {new Date(row.original.assigned_at).toLocaleDateString("de-DE")}
          </span>
          <span className="text-xs text-muted-foreground">
            von {row.original.assigned_by_name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "expires_at",
      header: "Läuft ab",
      cell: ({ row }) => (
        row.original.expires_at ? (
          <span className="text-sm">
            {new Date(row.original.expires_at).toLocaleDateString("de-DE")}
          </span>
        ) : (
          <span className="text-muted-foreground">Nie</span>
        )
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <IconSettings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleEditCompanyAccess(row.original)}
            >
              <IconEdit className="h-4 w-4 mr-2" />
              Berechtigung bearbeiten
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleRemoveCompanyAccess(row.original.id)}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Zugang entfernen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading || !pool || !stats) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Pool wird geladen...</h1>
            <p className="text-muted-foreground">Lade Pool-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/pools">
              <Button variant="outline" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Zurück zu Pools
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{pool.name}</h1>
                {getTypeBadge(pool.pool_type)}
                {getStatusBadge(pool.status)}
              </div>
              <p className="text-muted-foreground">
                {pool.description || "Keine Beschreibung verfügbar"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditingPool(true)}>
              <IconEdit className="h-4 w-4 mr-2" />
              Pool bearbeiten
            </Button>
            <Button onClick={() => {
              setAddingCandidates(true);
              loadAvailableCandidates();
            }}>
              <IconUserPlus className="h-4 w-4 mr-2" />
              Kandidaten hinzufügen
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Kandidaten</p>
                  <p className="text-2xl font-bold">{stats.activeCandidates}</p>
                  {pool.max_candidates && (
                    <p className="text-xs text-muted-foreground">von {pool.max_candidates}</p>
                  )}
                </div>
                <IconUsers className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unternehmen</p>
                  <p className="text-2xl font-bold">{stats.companiesWithAccess}</p>
                </div>
                <IconBuilding className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Auswahlen</p>
                  <p className="text-2xl font-bold">{stats.totalSelections}</p>
                </div>
                <IconStar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Diesen Monat</p>
                  <p className="text-2xl font-bold">{stats.selectionsThisMonth}</p>
                </div>
                <IconCalendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="candidates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="candidates">
              <IconUsers className="h-4 w-4 mr-2" />
              Kandidaten ({candidates.length})
            </TabsTrigger>
            <TabsTrigger value="companies">
              <IconBuilding className="h-4 w-4 mr-2" />
              Unternehmen ({companies.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <IconChartBar className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pool-Kandidaten</CardTitle>
                    <CardDescription>
                      Verwalte Kandidaten in diesem Pool ({candidates.length} Kandidaten)
                    </CardDescription>
                  </div>
                  <div>
                    <Button onClick={() => {
                      setAddingCandidates(true);
                      loadAvailableCandidates();
                    }}>
                      <IconUserPlus className="h-4 w-4 mr-2" />
                      Kandidaten hinzufügen
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={candidateColumns} 
                  data={candidates}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Unternehmenszugang</CardTitle>
                    <CardDescription>
                      Verwalte welche Unternehmen Zugang zu diesem Pool haben
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setAddingCompanies(true);
                    loadAvailableCompanies();
                  }}>
                    <IconBuildingPlus className="h-4 w-4 mr-2" />
                    Unternehmen hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={companyColumns} 
                  data={companies}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pool Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{stats.featuredCandidates}</p>
                      <p className="text-sm text-muted-foreground">Featured Kandidaten</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">Durchschnittsbewertung</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Skills im Pool</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topSkills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{skill.skill}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${(skill.count / stats.topSkills[0]?.count) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">
                            {skill.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Candidates Dialog */}
        <Dialog open={addingCandidates} onOpenChange={setAddingCandidates}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kandidaten zum Pool hinzufügen</DialogTitle>
              <DialogDescription>
                Wählen Sie Kandidaten aus, die Sie zu "{pool.name}" hinzufügen möchten
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-2">
                <IconSearch className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kandidaten suchen..."
                  value={candidateSearchTerm}
                  onChange={(e) => setCandidateSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Assignment Settings */}
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={addCandidateForm.priority}
                    onChange={(e) => setAddCandidateForm(prev => ({ 
                      ...prev, 
                      priority: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={addCandidateForm.featured}
                    onCheckedChange={(checked) => setAddCandidateForm(prev => ({ 
                      ...prev, 
                      featured: checked === true 
                    }))}
                  />
                  <Label htmlFor="featured">Als Featured markieren</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Input
                    id="notes"
                    placeholder="Optional..."
                    value={addCandidateForm.notes}
                    onChange={(e) => setAddCandidateForm(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                  />
                </div>
              </div>

              {/* Candidates List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredAvailableCandidates().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {candidateSearchTerm ? "Keine Kandidaten gefunden" : "Alle verfügbaren Kandidaten sind bereits im Pool"}
                  </div>
                ) : (
                  getFilteredAvailableCandidates().map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                        selectedCandidates.has(candidate.id) ? 'bg-accent border-primary' : ''
                      }`}
                      onClick={() => handleCandidateSelect(candidate.id)}
                    >
                      <Checkbox
                        checked={selectedCandidates.has(candidate.id)}
                        onChange={() => handleCandidateSelect(candidate.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {candidate.email}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedCandidates.size} Kandidat(en) ausgewählt
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAddingCandidates(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleAddCandidates}
                    disabled={selectedCandidates.size === 0}
                  >
                    <IconUserPlus className="h-4 w-4 mr-2" />
                    {selectedCandidates.size} Kandidat(en) hinzufügen
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Companies Dialog */}
        <Dialog open={addingCompanies} onOpenChange={setAddingCompanies}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Unternehmen Zugang gewähren</DialogTitle>
              <DialogDescription>
                Wählen Sie Unternehmen aus, denen Sie Zugang zu "{pool.name}" gewähren möchten
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-2">
                <IconSearch className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Unternehmen suchen..."
                  value={companySearchTerm}
                  onChange={(e) => setCompanySearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Access Settings */}
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="access_level">Zugriffslevel</Label>
                  <Select
                    value={addCompanyForm.access_level}
                    onValueChange={(value: "view" | "select" | "contact") => 
                      setAddCompanyForm(prev => ({ ...prev, access_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Anzeigen</SelectItem>
                      <SelectItem value="select">Auswählen</SelectItem>
                      <SelectItem value="contact">Kontaktieren</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Läuft ab (optional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={addCompanyForm.expires_at}
                    onChange={(e) => setAddCompanyForm(prev => ({ 
                      ...prev, 
                      expires_at: e.target.value 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_notes">Notizen</Label>
                  <Input
                    id="company_notes"
                    placeholder="Optional..."
                    value={addCompanyForm.notes}
                    onChange={(e) => setAddCompanyForm(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                  />
                </div>
              </div>

              {/* Companies List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredAvailableCompanies().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {companySearchTerm ? "Keine Unternehmen gefunden" : "Alle verfügbaren Unternehmen haben bereits Zugang"}
                  </div>
                ) : (
                  getFilteredAvailableCompanies().map((company) => (
                    <div
                      key={company.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                        selectedCompanies.has(company.id) ? 'bg-accent border-primary' : ''
                      }`}
                      onClick={() => handleCompanySelect(company.id)}
                    >
                      <Checkbox
                        checked={selectedCompanies.has(company.id)}
                        onChange={() => handleCompanySelect(company.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {company.company_name}
                        </div>
                        {company.industry && (
                          <div className="text-sm text-muted-foreground">
                            {company.industry}
                          </div>
                        )}
                        {company.location && (
                          <div className="text-xs text-muted-foreground">
                            {company.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedCompanies.size} Unternehmen ausgewählt
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAddingCompanies(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleAddCompanies}
                    disabled={selectedCompanies.size === 0}
                  >
                    <IconBuildingPlus className="h-4 w-4 mr-2" />
                    {selectedCompanies.size} Unternehmen hinzufügen
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Pool Dialog */}
        <Dialog open={editingPool} onOpenChange={setEditingPool}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pool bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeite die Einstellungen für {pool.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Pool-Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Pool-Name eingeben..."
                />
                {!editForm.name.trim() && (
                  <p className="text-sm text-red-600">Pool-Name ist erforderlich</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Beschreibung</Label>
                <textarea
                  id="edit-description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optionale Beschreibung des Pools..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-max-candidates">Maximale Kandidatenanzahl</Label>
                  <Input
                    id="edit-max-candidates"
                    type="number"
                    min="0"
                    value={editForm.max_candidates}
                    onChange={(e) => setEditForm(prev => ({ ...prev, max_candidates: e.target.value }))}
                    placeholder="Kein Limit (leer lassen)"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconUsers className="h-4 w-4" />
                    <span>Aktuell {candidates.length} Kandidaten im Pool</span>
                  </div>
                  {editForm.max_candidates && parseInt(editForm.max_candidates) < candidates.length && (
                    <p className="text-sm text-red-600">
                      ⚠️ Neues Limit ({editForm.max_candidates}) ist kleiner als aktuelle Kandidaten ({candidates.length})
                    </p>
                  )}
                  {editForm.max_candidates && parseInt(editForm.max_candidates) >= candidates.length && (
                    <p className="text-sm text-green-600">
                      ✅ Limit ist ausreichend für aktuelle Kandidaten
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pool-type">Pool-Typ</Label>
                    <Select
                      value={editForm.pool_type}
                      onValueChange={(value: "main" | "custom" | "featured" | "premium") => 
                        setEditForm(prev => ({ ...prev, pool_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Hauptpool</SelectItem>
                        <SelectItem value="custom">Custom Pool</SelectItem>
                        <SelectItem value="featured">Featured Pool</SelectItem>
                        <SelectItem value="premium">Premium Pool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Pool-Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value: "active" | "inactive" | "archived") => 
                        setEditForm(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="inactive">Inaktiv</SelectItem>
                        <SelectItem value="archived">Archiviert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Öffentlicher Pool</div>
                  <div className="text-sm text-muted-foreground">
                    Öffentliche Pools sind für alle zugewiesenen Unternehmen sichtbar
                  </div>
                </div>
                <Switch
                  checked={editForm.visibility === "public"}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, visibility: checked ? "public" : "private" }))}
                />
              </div>

              {/* Current Pool Info */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Aktuelle Pool-Informationen:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Erstellt:</span>
                    <div>{new Date(pool.created_at).toLocaleDateString("de-DE")}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Erstellt von:</span>
                    <div>{pool.created_by_name || "Unbekannt"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kandidaten:</span>
                    <div>{candidates.length} {pool.max_candidates ? `/ ${pool.max_candidates}` : "(unbegrenzt)"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unternehmen:</span>
                    <div>{companies.length} mit Zugang</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingPool(false)}>
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleSavePool}
                  disabled={!editForm.name.trim() || (!!editForm.max_candidates && parseInt(editForm.max_candidates) < candidates.length)}
                >
                  <IconDeviceFloppy className="h-4 w-4 mr-2" />
                  Änderungen speichern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Company Access Dialog */}
        <Dialog open={!!editingCompanyAccess} onOpenChange={(open) => !open && setEditingCompanyAccess(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Zugriffsberechtigung bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeite die Zugriffsrechte für {editingCompanyAccess?.company_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-access-level">Zugriffslevel</Label>
                <Select
                  value={editCompanyForm.access_level}
                  onValueChange={(value: "view" | "select" | "contact") => 
                    setEditCompanyForm(prev => ({ ...prev, access_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex flex-col">
                        <span>Anzeigen</span>
                        <span className="text-xs text-muted-foreground">Nur Pool-Kandidaten ansehen</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="select">
                      <div className="flex flex-col">
                        <span>Auswählen</span>
                        <span className="text-xs text-muted-foreground">Kandidaten ansehen und auswählen</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="contact">
                      <div className="flex flex-col">
                        <span>Kontaktieren</span>
                        <span className="text-xs text-muted-foreground">Kandidaten ansehen, auswählen und kontaktieren</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expires-at">Zugang läuft ab (optional)</Label>
                <Input
                  id="edit-expires-at"
                  type="date"
                  value={editCompanyForm.expires_at}
                  onChange={(e) => setEditCompanyForm(prev => ({ 
                    ...prev, 
                    expires_at: e.target.value 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Leer lassen für unbegrenzten Zugang
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company-notes">Notizen</Label>
                <textarea
                  id="edit-company-notes"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optionale Notizen..."
                  value={editCompanyForm.notes}
                  onChange={(e) => setEditCompanyForm(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  rows={2}
                />
              </div>

              {/* Current Info */}
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <div className="font-medium mb-2">Aktuelle Informationen:</div>
                <div className="space-y-1">
                  <div>
                    <span className="text-muted-foreground">Zugewiesen am:</span> {editingCompanyAccess ? new Date(editingCompanyAccess.assigned_at).toLocaleDateString("de-DE") : ""}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zugewiesen von:</span> {editingCompanyAccess?.assigned_by_name || "Unbekannt"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bisherige Auswahlen:</span> {editingCompanyAccess?.selection_count || 0}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingCompanyAccess(null)}>
                  Abbrechen
                </Button>
                <Button onClick={handleUpdateCompanyAccess}>
                  <IconDeviceFloppy className="h-4 w-4 mr-2" />
                  Änderungen speichern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 