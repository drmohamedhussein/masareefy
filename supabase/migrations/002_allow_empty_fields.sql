-- السماح بترك السعر والاسم فارغين (للتوافق إن كانت الجداول أُنشئت بالنسخة القديمة)

alter table public.expenses
  alter column amount drop not null;

alter table public.expenses
  drop constraint if exists expenses_amount_check;

alter table public.expenses
  add constraint expenses_amount_check
  check (amount is null or amount > 0);

alter table public.expenses
  drop constraint if exists expenses_item_name_check;

alter table public.expenses
  alter column item_name set default '';
