import Link from 'next/link';
import { docs, href } from '@/content/docs';

export default function Home() {
  return (
    <div className="home">
      <p className="crumb">Documentation</p>
      <h1>Background jobs for Postgres, without the infrastructure.</h1>
      <p className="lead">Relay lets you define typed jobs as plain functions, enqueue them in the same transaction as your data, and process them with stateless workers.</p>
      <div className="cta">
        <Link href="/docs/guides/quickstart/" className="btn">Get started →</Link>
        <code className="install">npm install @relay/core</code>
      </div>
      {(['Guides', 'Reference'] as const).map((s) => (
        <section key={s}>
          <h2>{s}</h2>
          <div className="cards">
            {docs.filter((d) => d.section === s).map((d) => (
              <Link key={href(d)} href={href(d)} className="card">
                <strong>{d.title}</strong>
                <span>{d.description}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
