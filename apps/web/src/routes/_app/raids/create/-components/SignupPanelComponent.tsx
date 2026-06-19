import { useEffect, useMemo, useState } from 'react';
import type { AdminGameServerListItem } from '#/lib/api/admin/game-servers-admin-api';
import type { SchoolOption } from '#/lib/api/admin/schools-admin-api';
import type { KungfuOption } from '#/lib/api/game-reference-api';
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
import {
  formatServerLabel,
  matchesOptionSearch,
} from './searchable-option-utils';

type SignupPanelComponentProps = {
  signup: SignupDraft | null;
  disabled?: boolean;
  onChange: (patch: Partial<SignupDraft>) => void;
  servers: AdminGameServerListItem[];
  schools: SchoolOption[];
  kungfus: KungfuOption[];
};

export function SignupPanelComponent({
  signup,
  disabled = false,
  onChange,
  servers,
  schools,
  kungfus,
}: SignupPanelComponentProps) {
  const [serverSearch, setServerSearch] = useState('');
  const [showServerResults, setShowServerResults] = useState(false);
  const [kungfuSearch, setKungfuSearch] = useState('');
  const [showKungfuResults, setShowKungfuResults] = useState(false);

  const schoolNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const school of schools) {
      map.set(school.id, school.name);
    }
    return map;
  }, [schools]);

  useEffect(() => {
    if (!signup?.serverId) {
      setServerSearch('');
      return;
    }

    const match = servers.find((server) => server.id === signup.serverId);
    if (match) {
      setServerSearch(formatServerLabel(match));
    }
  }, [signup?.serverId, servers]);

  useEffect(() => {
    if (!signup?.kungfuId) {
      setKungfuSearch('');
      return;
    }

    const match = kungfus.find((kungfu) => kungfu.id === signup.kungfuId);
    if (match) {
      setKungfuSearch(match.name);
    }
  }, [signup?.kungfuId, kungfus]);

  const filteredServers = useMemo(() => {
    return servers.filter((server) =>
      matchesOptionSearch(serverSearch, [
        server.zone,
        server.name,
        ...server.alias,
      ]),
    );
  }, [serverSearch, servers]);

  const filteredKungfus = useMemo(() => {
    return kungfus.filter((kungfu) => {
      const schoolName = schoolNameById.get(kungfu.schoolId) ?? '';
      return matchesOptionSearch(kungfuSearch, [
        kungfu.name,
        schoolName,
        ...kungfu.alias,
      ]);
    });
  }, [kungfuSearch, kungfus, schoolNameById]);

  const selectServer = (server: AdminGameServerListItem | null) => {
    if (!server) {
      onChange({ serverId: null });
      setServerSearch('');
      setShowServerResults(false);
      return;
    }

    onChange({ serverId: server.id });
    setServerSearch(formatServerLabel(server));
    setShowServerResults(false);
  };

  const selectKungfu = (kungfu: KungfuOption | null) => {
    if (!kungfu) {
      onChange({ kungfuId: null, schoolId: null });
      setKungfuSearch('');
      setShowKungfuResults(false);
      return;
    }

    onChange({ kungfuId: kungfu.id, schoolId: kungfu.schoolId });
    setKungfuSearch(kungfu.name);
    setShowKungfuResults(false);
  };

  if (!signup) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        点击中间网格中的格子以编辑团员信息
      </div>
    );
  }

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

      <div className="relative space-y-2">
        <Label htmlFor="signup-kungfu">心法</Label>
        <Input
          id="signup-kungfu"
          disabled={disabled}
          value={kungfuSearch}
          onChange={(event) => {
            setKungfuSearch(event.target.value);
            setShowKungfuResults(true);
          }}
          onFocus={() => setShowKungfuResults(true)}
          onBlur={() => {
            window.setTimeout(() => setShowKungfuResults(false), 150);
          }}
          placeholder="搜索心法、门派或别名"
        />
        {signup.kungfuId && signup.schoolId ? (
          <p className="text-xs text-muted-foreground">
            门派：{schoolNameById.get(signup.schoolId) ?? '—'}
          </p>
        ) : null}
        {showKungfuResults ? (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectKungfu(null)}
            >
              未选择
            </button>
            {filteredKungfus.length > 0 ? (
              filteredKungfus.map((kungfu) => {
                const schoolName = schoolNameById.get(kungfu.schoolId);
                return (
                  <button
                    key={kungfu.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectKungfu(kungfu)}
                  >
                    <span className="font-medium">{kungfu.name}</span>
                    {schoolName ? (
                      <span className="ml-2 text-muted-foreground">
                        {schoolName}
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                未找到心法
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="relative space-y-2">
        <Label htmlFor="signup-server">服务器</Label>
        <Input
          id="signup-server"
          disabled={disabled}
          value={serverSearch}
          onChange={(event) => {
            setServerSearch(event.target.value);
            setShowServerResults(true);
          }}
          onFocus={() => setShowServerResults(true)}
          onBlur={() => {
            window.setTimeout(() => setShowServerResults(false), 150);
          }}
          placeholder="搜索服务器或别名"
        />
        {showServerResults ? (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectServer(null)}
            >
              未选择
            </button>
            {filteredServers.length > 0 ? (
              filteredServers.map((server) => (
                <button
                  key={server.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectServer(server)}
                >
                  <span className="font-medium">
                    {formatServerLabel(server)}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                未找到服务器
              </p>
            )}
          </div>
        ) : null}
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
