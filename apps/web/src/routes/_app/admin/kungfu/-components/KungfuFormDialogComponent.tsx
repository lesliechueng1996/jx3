import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  type AdminKungfuListItem,
  ATTACK_METHOD_LABELS,
  ATTACK_METHODS,
  ATTACK_TYPE_LABELS,
  ATTACK_TYPES,
  type AttackMethod,
  type AttackType,
  emptyFormationEffectInputs,
  FORMATION_EFFECT_LEVEL_LABELS,
  formatAliasInput,
  KUNGFU_TYPE_LABELS,
  KUNGFU_TYPES,
  type KungfuFormValues,
  type KungfuType,
  parseAliasInput,
  parseFormationEffectInput,
  serializeFormationEffectInput,
} from '#/lib/api/admin/kungfu-admin-api';
import {
  schoolsAdminApi,
  schoolsAdminQueryKey,
} from '#/lib/api/admin/schools-admin-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type KungfuFormDialogComponentProps = {
  kungfu: AdminKungfuListItem | null;
  mode: 'create' | 'edit';
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: KungfuFormValues) => void;
};

const NONE_VALUE = '__none__';

const emptyForm = (): KungfuFormValues => ({
  name: '',
  schoolId: '',
  kungfuType: 'attack',
  attackType: null,
  attackMethod: null,
  formationName: null,
  formationEffect: null,
  isPveExternalRecommended: false,
  isPveInternalRecommended: false,
  isUnlimited: false,
  icon: null,
  alias: [],
});

export function KungfuFormDialogComponent({
  kungfu,
  mode,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: KungfuFormDialogComponentProps) {
  const [form, setForm] = useState<KungfuFormValues>(emptyForm);
  const [aliasInput, setAliasInput] = useState('');
  const [formationEffectInputs, setFormationEffectInputs] = useState(
    emptyFormationEffectInputs,
  );

  const schoolsOptionsQuery = useQuery({
    queryKey: [...schoolsAdminQueryKey, 'options'],
    queryFn: () => schoolsAdminApi.listOptions(),
    enabled: open,
  });

  useEffect(() => {
    if (mode === 'edit' && kungfu) {
      setForm({
        name: kungfu.name,
        schoolId: kungfu.schoolId,
        kungfuType: kungfu.kungfuType,
        attackType: kungfu.attackType,
        attackMethod: kungfu.attackMethod,
        formationName: kungfu.formationName,
        formationEffect: kungfu.formationEffect,
        isPveExternalRecommended: kungfu.isPveExternalRecommended,
        isPveInternalRecommended: kungfu.isPveInternalRecommended,
        isUnlimited: kungfu.isUnlimited,
        icon: kungfu.icon,
        alias: kungfu.alias,
      });
      setAliasInput(formatAliasInput(kungfu.alias));
      setFormationEffectInputs(
        parseFormationEffectInput(kungfu.formationEffect),
      );
      return;
    }

    if (mode === 'create') {
      const defaults = emptyForm();
      const firstSchoolId = schoolsOptionsQuery.data?.items[0]?.id ?? '';
      setForm({ ...defaults, schoolId: firstSchoolId });
      setAliasInput('');
      setFormationEffectInputs(emptyFormationEffectInputs());
    }
  }, [mode, kungfu, schoolsOptionsQuery.data?.items]);

  const handleSubmit = () => {
    onSubmit({
      ...form,
      name: form.name.trim(),
      icon: form.icon?.trim() ? form.icon.trim() : null,
      formationName: form.formationName?.trim()
        ? form.formationName.trim()
        : null,
      formationEffect: serializeFormationEffectInput(formationEffectInputs),
      alias: parseAliasInput(aliasInput),
    });
  };

  const canSubmit =
    form.name.trim().length > 0 && form.schoolId.length > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建心法' : '编辑心法'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写心法信息以创建新记录。'
              : '修改心法信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kungfu-name">心法名称</Label>
            <Input
              id="kungfu-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>所属门派</Label>
            <Select
              value={form.schoolId || NONE_VALUE}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  schoolId: value === NONE_VALUE ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择门派" />
              </SelectTrigger>
              <SelectContent>
                {(schoolsOptionsQuery.data?.items ?? []).map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>心法类型</Label>
            <Select
              value={form.kungfuType}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  kungfuType: value as KungfuType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KUNGFU_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {KUNGFU_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>攻击类型</Label>
              <Select
                value={form.attackType ?? NONE_VALUE}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    attackType:
                      value === NONE_VALUE ? null : (value as AttackType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="无" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>无</SelectItem>
                  {ATTACK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ATTACK_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>攻击方式</Label>
              <Select
                value={form.attackMethod ?? NONE_VALUE}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    attackMethod:
                      value === NONE_VALUE ? null : (value as AttackMethod),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="无" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>无</SelectItem>
                  {ATTACK_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {ATTACK_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kungfu-icon">图标 URL</Label>
            <Input
              id="kungfu-icon"
              value={form.icon ?? ''}
              placeholder="可选，填写图标地址"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  icon: event.target.value || null,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kungfu-formation-name">阵眼名称</Label>
            <Input
              id="kungfu-formation-name"
              value={form.formationName ?? ''}
              placeholder="可选，填写阵眼名称"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  formationName: event.target.value || null,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>阵眼效果</Label>
            <div className="space-y-2">
              {FORMATION_EFFECT_LEVEL_LABELS.map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <Label
                    htmlFor={`kungfu-formation-effect-${index}`}
                    className="w-14 shrink-0 text-muted-foreground"
                  >
                    {label}
                  </Label>
                  <Input
                    id={`kungfu-formation-effect-${index}`}
                    value={formationEffectInputs[index] ?? ''}
                    placeholder={`填写${label}效果`}
                    onChange={(event) =>
                      setFormationEffectInputs((current) =>
                        current.map((line, lineIndex) =>
                          lineIndex === index ? event.target.value : line,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>外功阵眼</Label>
              <Select
                value={String(form.isPveExternalRecommended)}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    isPveExternalRecommended: value === 'true',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>内功阵眼</Label>
              <Select
                value={String(form.isPveInternalRecommended)}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    isPveInternalRecommended: value === 'true',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>无界</Label>
              <Select
                value={String(form.isUnlimited)}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    isUnlimited: value === 'true',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kungfu-alias">别名</Label>
            <Input
              id="kungfu-alias"
              value={aliasInput}
              placeholder="多个别名请用逗号分隔"
              onChange={(event) => setAliasInput(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
