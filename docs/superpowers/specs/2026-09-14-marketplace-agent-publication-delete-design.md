# Marketplace Agent publication deletion

## Context

An Agent published from the Agents page creates an independent Marketplace publication and version snapshot. Deleting the source Agent currently leaves that publication visible in Marketplace because no deletion path exists for `agent_publications`. Installing a publication creates a separate Agent record with copied configuration, so removing the publication must not remove installed copies.

## Design

Add an admin-only deletion path for Marketplace Agent publications.

- Add `DELETE /api/market/agents/{publication_id}`.
- Require the existing `require_admin` dependency before reading or deleting the publication.
- Delete all `agent_publication_versions` belonging to the publication, then delete the `agent_publications` row.
- Return the deleted publication id. Return 404 when the publication does not exist.
- Do not modify `agents`, including installed Agents whose `source_publication_id` points at the deleted publication.

On the Marketplace Agents tab:

- Add the existing Lucide `trash-2` icon to the card bottom action area, right aligned with the existing Agents card layout.
- Render it only when `authUser?.role === 'admin'`.
- Clicking the icon opens a confirmation dialog. The copy explains that the Marketplace listing and future installs will be removed while existing installed Agents remain available.
- Confirmation calls the DELETE endpoint, removes the listing from `marketAgents`, closes the dialog, and shows the existing toast/error feedback.
- Keep the install button available independently of the delete action.

## Testing

Add regression coverage for:

1. Store deletion removes the publication and every version while leaving an installed Agent intact.
2. Admin API deletion removes the Marketplace listing and keeps the installed Agent accessible.
3. A normal user receives 403 from the deletion endpoint.
4. The frontend contains the admin-only trash action, confirmation behavior, and delete request.

Update the README HTTP surface table with the new endpoint. No migration is required because the existing tables already contain the records being removed.

## Risks and mitigations

The principal risk is accidental deletion of a published listing. The UI confirmation and admin-only API guard mitigate this. Installed copies are protected by deleting only publication/version rows and are explicitly covered by regression tests. A deleted publication cannot be installed again unless it is republished.
