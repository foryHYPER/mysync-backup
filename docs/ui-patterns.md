# UI Pattern: Dashboard Section Cards

This document describes the standard UI pattern for dashboard pages (e.g., candidate profile, invitations, etc.) in this project. Use this as a reference for creating new UI sections to ensure a consistent look and feel.

---

## Structure

- **Wrapper:**
  - Use a flex column layout: `flex flex-1 flex-col`.
  - Use a responsive container: `@container/main flex flex-1 flex-col gap-2`.
  - Add vertical spacing: `flex flex-col gap-4 py-4 md:gap-6 md:py-6`.
  - Use horizontal padding: `px-4 lg:px-6`.

- **Card:**
  - Use the shadcn `Card` component to wrap each dashboard section.
  - Use `CardHeader` and `CardTitle` for the section title.
  - Place main content (forms, tables, etc.) inside `CardContent`.
  - Place actions or pagination in `CardFooter`.

---

## Example: Invitations Table

```tsx
<div className="flex flex-1 flex-col">
  <div className="@container/main flex flex-1 flex-col gap-2">
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Einladungen</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search, Table, etc. */}
          </CardContent>
          <CardFooter>
            {/* Pagination, Actions, etc. */}
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</div>
```

---

## Best Practices

- **Always use a Card** for each main dashboard section.
- **Keep spacing consistent** by using the same wrapper classes as above.
- **Use CardHeader for titles** and CardContent for main content.
- **Use CardFooter** for actions, pagination, or summary info.
- **For tables:**
  - Use the shadcn `DataTable` pattern inside `CardContent`.
  - Place search/filter inputs above the table, inside `CardContent`.
  - Place pagination controls in `CardFooter`.
- **For forms:**
  - Place the form inside `CardContent`.
  - Place submit/cancel buttons in `CardFooter`.

---

## When to Use
- Any dashboard page or section (profile, invitations, settings, etc.)
- Any place where you want a clear, card-based separation of content

---

## References
- [shadcn/ui Card](https://ui.shadcn.com/docs/components/card)
- [shadcn/ui DataTable](https://ui.shadcn.com/docs/components/data-table)

---

_Last updated: 2024-05-10_ 