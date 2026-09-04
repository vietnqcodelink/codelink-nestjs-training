import { CircleAlertIcon, InboxIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export function TableLoading({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex gap-3">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyList({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Empty className="min-h-72 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Empty className="min-h-72 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Unable to load data</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}
