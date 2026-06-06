import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function NotFoundComponent() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>页面未找到</CardTitle>
          <CardDescription>您访问的页面不存在。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/">返回首页</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
