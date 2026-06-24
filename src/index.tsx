import { Hono } from 'hono'

const app = new Hono()

// SHIN COMPANY 정적 사이트 — Cloudflare Workers 진입점
// 실제 HTML/CSS/JS 파일은 wrangler.jsonc의 assets 설정으로 서빙됨
// Worker는 API 라우트 또는 리다이렉트 처리용

app.get('/health', (c) => {
  return c.json({ status: 'ok', site: 'shinco.kr' })
})

export default app
