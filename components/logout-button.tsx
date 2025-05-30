'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { IconLogout } from '@tabler/icons-react'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <DropdownMenuItem 
      onClick={logout} 
      className="cursor-pointer text-destructive focus:text-destructive"
    >
      <IconLogout className="mr-2 h-4 w-4" />
      Log out
    </DropdownMenuItem>
  )
}