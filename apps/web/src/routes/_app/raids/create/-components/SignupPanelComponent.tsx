import { useQuery } from '@tanstack/react-query';
import {
  gameReferenceApi,
  gameReferenceQueryKey,
} from '#/lib/api/game-reference-api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { SignupDraft } from './raid-run-form-schema';
import { RAID_SIGNUP_ROLES, ROLE_LABELS } from './role-slot-utils';

type SignupPanelComponentProps = {
  signup: SignupDraft | null;
  disabled?: boolean;
  onChange: (patch: Partial<SignupDraft>) => void;
};

const NONE_VALUE = '__none__';

export function SignupPanelComponent({
  signup,
  disabled = false,
  onChange,
}: SignupPanelComponentProps) {
  const serversQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'servers'],
    queryFn: () => gameReferenceApi.listGameServers(),
  });

  const schoolsQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'schools'],
    queryFn: () => gameReferenceApi.listSchoolOptions(),
  });

  const kungfuQuery = useQuery({
    queryKey: [...gameReferenceQueryKey, 'kungfu', signup?.schoolId],
    queryFn: () => gameReferenceApi.listKungfuOptions(signup?.schoolId ?? ''),
    enabled: Boolean(signup?.schoolId),
  });

  if (!signup) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        点击中间网格中的格子以编辑团员信息
      </div>
    );
  }

  const servers = serversQuery.data?.items ?? [];
  const schools = schoolsQuery.data?.items ?? [];
  const kungfus = kungfuQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {signup.groupNumber} 队 · 第 {signup.positionNumber} 位
        </h3>
      </div>

      <div className="space-y-2">
        <Label>职能</Label>
        <Select
          disabled={disabled}
          value={signup.role}
          onValueChange={(value) =>
            onChange({
              role: value as SignupDraft['role'],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RAID_SIGNUP_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-character-name">角色名</Label>
        <Input
          id="signup-character-name"
          disabled={disabled}
          value={signup.characterName ?? ''}
          onChange={(event) =>
            onChange({ characterName: event.target.value || null })
          }
          placeholder="游戏内角色名"
        />
      </div>

      <div className="space-y-2">
        <Label>服务器</Label>
        <Select
          disabled={disabled}
          value={signup.serverId ?? NONE_VALUE}
          onValueChange={(value) =>
            onChange({ serverId: value === NONE_VALUE ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="选择服务器" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>未选择</SelectItem>
            {servers.map((server) => (
              <SelectItem key={server.id} value={server.id}>
                {server.zone} · {server.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>门派</Label>
        <Select
          disabled={disabled}
          value={signup.schoolId ?? NONE_VALUE}
          onValueChange={(value) => {
            const schoolId = value === NONE_VALUE ? null : value;
            onChange({
              schoolId,
              kungfuId: null,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择门派" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>未选择</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>心法</Label>
        <Select
          disabled={disabled || !signup.schoolId}
          value={signup.kungfuId ?? NONE_VALUE}
          onValueChange={(value) =>
            onChange({ kungfuId: value === NONE_VALUE ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="选择心法" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>未选择</SelectItem>
            {kungfus.map((kungfu) => (
              <SelectItem key={kungfu.id} value={kungfu.id}>
                {kungfu.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={signup.isLeader}
            onChange={(event) => onChange({ isLeader: event.target.checked })}
            className="size-4 rounded border"
          />
          是否团长（全团互斥）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={signup.isDarkRun}
            onChange={(event) => onChange({ isDarkRun: event.target.checked })}
            className="size-4 rounded border"
          />
          是否黑本（全团互斥）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={signup.isFormationCore}
            onChange={(event) =>
              onChange({ isFormationCore: event.target.checked })
            }
            className="size-4 rounded border"
          />
          是否阵眼（同队互斥）
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-remark">备注</Label>
        <Textarea
          id="signup-remark"
          disabled={disabled}
          value={signup.remark ?? ''}
          onChange={(event) => onChange({ remark: event.target.value || null })}
          rows={3}
        />
      </div>
    </div>
  );
}
