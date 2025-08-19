import { Topic, Article } from '@/lib/schemas'

interface IDigestHtmlRenderer {
    render(topics: Topic[], articles: Article[]): string
}

export class DigestHtmlRenderer implements IDigestHtmlRenderer {
    private esc(s: string | undefined = ''): string {
        return (s || '').replace(
            /[&<>"]/g,
            (c: string) =>
                ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[
                    c
                ] || ''
        )
    }

    private renderArticles(articles: Article[]): string {
        const now = Date.now()

        return articles
            .map((a, idx) => {
                const url = this.esc(a.url)
                const title = this.esc(a.title)
                const source = this.esc(a.source)
                const snippet = this.esc(a.snippet)

                let hoursText = ''
                if (a.publishedDate) {
                    const diffH = Math.max(
                        0,
                        (now - new Date(a.publishedDate).getTime()) / 36e5
                    )
                    const hoursVal = Math.round(diffH)
                    if (hoursVal > 0) {
                        hoursText = ` • ⏱️ ${hoursVal}h ago`
                    }
                }

                const block = `
          <div class="article">
            <a class="title" href="${url}" target="_blank" rel="noopener">📄 ${title}</a>
            <div class="meta">${source}${hoursText}</div>
            <p class="snippet">${snippet ? this.esc(snippet) : ''}</p>
          </div>
        `
                const sep =
                    idx < articles.length - 1
                        ? `<div class="softline"></div>`
                        : ''
                return block + sep
            })
            .join('')
    }

    private renderTopicSections(topics: Topic[], articles: Article[]): string {
        const articlesByTopic = new Map<string, Article[]>(
            topics.map((topic) => [topic.id, []])
        )

        articles.forEach((article) => {
            const topicArticles = articlesByTopic.get(article.topicId)
            if (topicArticles) {
                topicArticles.push(article)
            }
        })

        return topics
            .map((topic) => {
                const topicArticles = articlesByTopic.get(topic.id) || []
                if (topicArticles.length === 0) return ''

                const articlesHTML = this.renderArticles(topicArticles)
                return `
          <div class="topic">📢 ${this.esc(topic.name)}</div>
          ${articlesHTML}
          <div class="divider"></div>
        `
            })
            .join('')
    }

    render(topics: Topic[], articles: Article[]): string {
        const sections = this.renderTopicSections(topics, articles)

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>catchup</title>
  <style>
    body { margin:0; padding:0; background:#f6f7f9; }
    table { border-collapse:collapse; }
    a { text-decoration:none; }
    .wrap { width:100%; background:#f6f7f9; padding:24px 0; }
    .container { width:100%; max-width:680px; margin:0 auto; background:#ffffff; border-radius:12px; }
    .inner { padding:24px; }
    .brand { font:800 18px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111; letter-spacing:.2px; text-transform: lowercase; }
    .pre { font:400 13px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#556; opacity:.9; margin:8px 0 0; }
    .divider { height:1px; background:#eceff3; margin:16px 0; }
    .topic { font:700 16px/1.3 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111; margin:24px 0 8px; }
    .article { padding:12px 0; }
    .title { font:600 15px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0d47a1; }
    .meta { font:500 12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#667085; margin-top:4px; }
    .snippet { font:400 13px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#2f3a4a; margin:6px 0 0; }
    .summary-list { margin:8px 0 0 18px; padding:0; }
    .summary-list li { font:400 13px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#2f3a4a; margin:4px 0; }
    .softline { height:1px; background:#f1f3f6; margin:12px 0; }
    .footer { font:400 12px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#7b8794; text-align:center; padding:16px 24px 0; }
    @media (max-width: 480px) {
      .inner { padding:18px; }
      .container { border-radius:10px; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0">
          <tr>
            <td class="inner">
              <div class="brand">catchup</div>
              <div class="pre">the latest updates on topics you care about</div>
              <div class="divider"></div>
              ${
                  articles.length > 0
                      ? sections
                      : `
                <div class="snippet">
                  📭 Looks like you're all caught up — no new updates for now.
                  <br />Check back later for fresh stories.
                </div>
                <div class="divider"></div>
              `
              }
              <div class="footer">
                You're receiving this email because you subscribed to catchup.
                <br />Manage topics or unsubscribe anytime.
              </div>
            </td>
          </tr>
        </table>
        <div style="height:24px;"></div>
      </td>
    </tr>
  </table>
</body>
</html>`
    }
}
