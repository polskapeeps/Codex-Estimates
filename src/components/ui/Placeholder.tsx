import { PageHeader } from './PageHeader';
import { EmptyState } from './EmptyState';

/** Temporary page used for routes still being built out (removed per milestone). */
export function Placeholder({
  title,
  note,
  back,
}: {
  title: string;
  note: string;
  back?: boolean | string;
}) {
  return (
    <div>
      <PageHeader title={title} back={back} />
      <EmptyState title="Under construction" message={note} />
    </div>
  );
}
