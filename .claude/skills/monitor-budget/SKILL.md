---
name: monitor-budget
description: Anlik butce durumu. mkt_usage_logs'dan mevcut harcamayi ve limitleri gosterir. Usage: /monitor-budget
---

# Budget Monitor

Quick budget status check — lighter than /cost-report.

## Step 1: Query Current Month Spending

Using the Supabase MCP, query the Marketing Supabase project:
```sql
SELECT
  COALESCE(SUM(estimated_cost_usd), 0) as total_spent,
  COUNT(*) as api_calls,
  MAX(created_at) as last_call
FROM mkt_usage_logs
WHERE created_at >= DATE_TRUNC('month', NOW())
```

## Step 2: Calculate Status

- Monthly limit: $500
- Usage percentage = total_spent / 500 * 100
- Days elapsed in month = EXTRACT(DAY FROM NOW())
- Daily average = total_spent / days_elapsed
- Projected monthly = daily_average * days_in_month

## Step 3: Output

```
📊 Butce Durumu

Harcanan: $X.XX / $500.00
Kullanim: ██████░░░░ %Y
API cagri: Z (son: <timestamp>)
Gunluk ort: $X.XX
Tahmini ay sonu: $X.XX

<status message>
```

Status levels:
- < 50%: ✅ Normal
- 50-75%: ℹ️ Dikkat — butcenin yarisi kullanildi
- 75-90%: ⚠️ Uyari — butce sinirina yaklasildi
- > 90%: 🚨 Kritik — butce neredeyse doldu
