import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Code } from '@/components/Code';
import { anchor, type Block, docs, getDoc, href } from '@/content/docs';

export const dynamicParams = false;
export const generateStaticParams = () => docs.map((d) => ({ slug: d.slug }));

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props) {
  const doc = getDoc((await params).slug);
  return { title: `${doc?.title} · Relay Docs`, description: doc?.description };
}

// Render `inline code` spans inside plain text.
function Inline({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part)}</>;
}

function Render({ b }: { b: Block }) {
  switch (b.type) {
    case 'p': return <p><Inline text={b.text} /></p>;
    case 'h2': return <h2 id={anchor(b.text)}><a href={`#${anchor(b.text)}`}>{b.text}</a></h2>;
    case 'h3': return <h3 id={anchor(b.text)}>{b.text}</h3>;
    case 'code': return <Code code={b.code} lang={b.lang} title={b.title} />;
    case 'callout': return <div className={`callout ${b.tone}`}><strong>{b.tone}</strong><p><Inline text={b.text} /></p></div>;
    case 'list': {
      const L = b.ordered ? 'ol' : 'ul';
      return <L>{b.items.map((t) => <li key={t}><Inline text={t} /></li>)}</L>;
    }
    case 'table': return (
      <div className="table"><table>
        <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}><Inline text={i === 0 ? `\`${c}\`` : c} /></td>)}</tr>)}</tbody>
      </table></div>
    );
  }
}

export default async function DocPage({ params }: Props) {
  const doc = getDoc((await params).slug);
  if (!doc) notFound();
  const i = docs.indexOf(doc);
  const prev = docs[i - 1], next = docs[i + 1];
  const toc = doc.body.filter((b) => b.type === 'h2');

  return (
    <div className="page">
      <article>
        <p className="crumb">{doc.section}</p>
        <h1>{doc.title}</h1>
        <p className="lead">{doc.description}</p>
        {doc.body.map((b, k) => <Render key={k} b={b} />)}
        <footer className="pager">
          {prev ? <Link href={href(prev)}><small>Previous</small>{prev.title}</Link> : <span />}
          {next ? <Link href={href(next)} className="next"><small>Next</small>{next.title}</Link> : <span />}
        </footer>
        <p className="updated">Last updated {doc.updated}</p>
      </article>
      <aside className="toc">
        <p className="nav-h">On this page</p>
        {toc.map((h) => h.type === 'h2' && <a key={h.text} href={`#${anchor(h.text)}`}>{h.text}</a>)}
      </aside>
    </div>
  );
}
