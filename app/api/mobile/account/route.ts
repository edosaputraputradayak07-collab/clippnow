import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/mobile-request';
import { createAdminClient } from '@/lib/supabase/admin';
import { noStoreHeaders } from '@/lib/security/request';

const BUCKET = 'clippnow-videos';
const PAGE_SIZE = 1000;

export async function DELETE(request: Request) {
  const mobileUser = await getMobileUser(request);
  if (!mobileUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  }

  const admin = createAdminClient();
  const prefix = mobileUser.user.id;

  for (;;) {
    const { data: objects, error: listError } = await admin.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE_SIZE, offset: 0 });

    if (listError) {
      return NextResponse.json({ error: 'Gagal menyiapkan penghapusan file akun.' }, { status: 500, headers: noStoreHeaders() });
    }
    if (!objects.length) break;

    const paths = objects.map((object) => `${prefix}/${object.name}`);
    const { error: removeError } = await admin.storage.from(BUCKET).remove(paths);
    if (removeError) {
      return NextResponse.json({ error: 'Gagal menghapus file akun.' }, { status: 500, headers: noStoreHeaders() });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(mobileUser.user.id, false);
  if (deleteError) {
    return NextResponse.json({ error: 'Gagal menghapus akun.' }, { status: 500, headers: noStoreHeaders() });
  }

  return NextResponse.json({ deleted: true }, { headers: noStoreHeaders() });
}
