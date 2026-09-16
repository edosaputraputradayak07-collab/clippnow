import { EditorForm } from '../../components/editor/editor-form';

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ clip?: string }> }) {
  const { clip = '' } = await searchParams;
  return <main className="editor-shell"><header className="app-header"><a className="brand" href="/">VidClipMoney</a><a className="secondary-button" href="/results">Hasil</a></header><EditorForm clipId={clip} /></main>;
}
