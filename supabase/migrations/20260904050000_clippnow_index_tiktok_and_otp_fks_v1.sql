create index if not exists auth_otp_audit_user_id_idx on public.auth_otp_audit(user_id);
create index if not exists tiktok_posts_project_id_idx on public.tiktok_posts(project_id);
create index if not exists tiktok_posts_tiktok_account_id_idx on public.tiktok_posts(tiktok_account_id);
