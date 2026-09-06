import { createClient } from '@/lib/supabase/server';
import CreateStudio from './create-studio';

export default async function CreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('credits,plan').eq('id', user.id).single();
  const credits = profile?.credits ?? 0;
  const plan = profile?.plan ?? 'trial';

  return <CreateStudio initialCredits={credits} plan={plan} />;
}
