import { KnowledgeBaseSearch } from '@/components/knowledge/KnowledgeBaseSearch'

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cơ Sở Kiến Thức</h1>
        <p className="text-muted-foreground">
          Tìm kiếm và quản lý thông tin về du học, visa và quy trình nộp đơn
        </p>
      </div>
      <KnowledgeBaseSearch />
    </div>
  )
}
