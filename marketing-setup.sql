-- ================================================================
-- 胖寶餃子 行銷排程系統 SQL
-- 執行位置：Supabase SQL Editor
-- ================================================================

-- 1. 行銷貼文排程表
create table if not exists marketing_posts (
  id uuid default gen_random_uuid() primary key,
  platform text not null check (platform in ('line', 'facebook', 'instagram', 'google', 'all')),
  title text,
  content text not null,
  media_url text,                        -- 圖片公開 HTTPS URL（IG 必須填）
  target_audience text default 'all',    -- 客群備註（如：冷凍宅配、門市熟食）
  scheduled_at timestamptz not null,     -- 預定發布時間（台灣時區請加 +08:00）
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'published', 'failed')),
  error_log text,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- 加快排程查詢速度
create index if not exists idx_marketing_posts_schedule
  on marketing_posts (status, scheduled_at);

-- RLS（允許 anon 讀寫，與 transactions 表相同設定）
alter table marketing_posts enable row level security;

create policy "anon can read marketing_posts"
  on marketing_posts for select using (true);

create policy "anon can insert marketing_posts"
  on marketing_posts for insert with check (true);

create policy "anon can update marketing_posts"
  on marketing_posts for update using (true);

create policy "anon can delete marketing_posts"
  on marketing_posts for delete using (true);


-- ================================================================
-- 2. LINE Broadcast 發送函式（沿用現有 pg_net + Vault 架構）
-- ================================================================
create or replace function send_line_broadcast()
returns void
language plpgsql
security definer
as $$
declare
  v_token text;
  v_post record;
  v_body jsonb;
  v_messages jsonb;
  v_req_id bigint;
begin
  -- 從 Vault 取得 LINE Channel Access Token（官方帳號用）
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name = 'LINE_OA_TOKEN'
  limit 1;

  -- 若 Vault 沒有 LINE_OA_TOKEN，退而使用 LINE_TOKEN
  if v_token is null then
    select decrypted_secret into v_token
    from vault.decrypted_secrets
    where name = 'LINE_TOKEN'
    limit 1;
  end if;

  if v_token is null then
    raise exception 'LINE token not found in Vault';
  end if;

  -- 找出所有到時間且 status = ready 的貼文（LINE 平台）
  for v_post in
    select * from marketing_posts
    where status = 'ready'
      and (platform = 'line' or platform = 'all')
      and scheduled_at <= now()
    order by scheduled_at
  loop
    -- 組合訊息（有圖片就加圖）
    if v_post.media_url is not null then
      v_messages := jsonb_build_array(
        jsonb_build_object(
          'type', 'image',
          'originalContentUrl', v_post.media_url,
          'previewImageUrl', v_post.media_url
        ),
        jsonb_build_object('type', 'text', 'text', v_post.content)
      );
    else
      v_messages := jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', v_post.content)
      );
    end if;

    v_body := jsonb_build_object('messages', v_messages);

    -- 發送 LINE Broadcast
    select net.http_post(
      url := 'https://api.line.me/v2/bot/message/broadcast',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_token
      ),
      body := v_body
    ) into v_req_id;

    -- 更新狀態為已發送
    update marketing_posts
    set status = 'published',
        published_at = now()
    where id = v_post.id;

  end loop;

exception when others then
  -- 若整批失敗，記錄錯誤
  update marketing_posts
  set status = 'failed',
      error_log = sqlerrm
  where status = 'ready'
    and (platform = 'line' or platform = 'all')
    and scheduled_at <= now();
end;
$$;


-- ================================================================
-- 3. pg_cron 排程：每 30 分鐘檢查一次是否有待發貼文
-- ================================================================
select cron.schedule(
  'pangbao-line-broadcast',
  '*/30 * * * *',
  'select send_line_broadcast()'
);

-- 查看排程是否成功建立：
-- select * from cron.job where jobname = 'pangbao-line-broadcast';

-- 停用排程：
-- select cron.unschedule('pangbao-line-broadcast');
