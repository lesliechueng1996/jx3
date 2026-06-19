import { useEffect, useState } from 'react';
import type { RaidRunWage, RaidSignupResponse } from '#/lib/api/raid-runs-api';
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
import { computeWagePerPerson, countNamedSignups } from './item-utils';

type RecordWageDialogComponentProps = {
  open: boolean;
  wage: RaidRunWage;
  signups: RaidSignupResponse[];
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RaidRunWage) => void;
};

export function RecordWageDialogComponent({
  open,
  wage,
  signups,
  pending = false,
  onOpenChange,
  onSubmit,
}: RecordWageDialogComponentProps) {
  const [totalIncomeInput, setTotalIncomeInput] = useState('');
  const [wagePerPersonInput, setWagePerPersonInput] = useState('');
  const [wageTouched, setWageTouched] = useState(false);

  const participantCount = countNamedSignups(signups);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTotalIncomeInput(wage.totalIncome ?? '');
    setWagePerPersonInput(wage.wagePerPerson ?? '');
    setWageTouched(false);
  }, [open, wage.totalIncome, wage.wagePerPerson]);

  useEffect(() => {
    if (wageTouched) {
      return;
    }

    const computed = computeWagePerPerson(totalIncomeInput, participantCount);
    if (computed !== null) {
      setWagePerPersonInput(computed);
    }
  }, [participantCount, totalIncomeInput, wageTouched]);

  const handleSubmit = () => {
    onSubmit({
      totalIncome: totalIncomeInput.trim() ? totalIncomeInput.trim() : null,
      wagePerPerson: wagePerPersonInput.trim()
        ? wagePerPersonInput.trim()
        : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>记录工资</DialogTitle>
          <DialogDescription>
            填写金团总收入与每人工资。已填写角色名的团员共 {participantCount}{' '}
            人，修改总收入会自动计算人均工资。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total-income">金团总计（金）</Label>
            <Input
              id="total-income"
              inputMode="decimal"
              disabled={pending}
              value={totalIncomeInput}
              onChange={(event) => setTotalIncomeInput(event.target.value)}
              placeholder="例如：50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wage-per-person">人均工资（金）</Label>
            <Input
              id="wage-per-person"
              inputMode="decimal"
              disabled={pending}
              value={wagePerPersonInput}
              onChange={(event) => {
                setWageTouched(true);
                setWagePerPersonInput(event.target.value);
              }}
              placeholder={
                participantCount > 0 ? '根据总人数自动计算' : '请手动填写'
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button disabled={pending} onClick={handleSubmit}>
            {pending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
