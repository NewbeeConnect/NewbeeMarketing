---
name: cost-report
description: AI maliyet raporu. mkt_usage_logs tablosundan model, gun ve operasyon bazinda harcama gosterir. Usage: /cost-report [today|week|month]
---

# AI Cost Report

Parse `$ARGUMENTS` to determine the time range. Default is `month`.

- `today` — current day
- `week` — last 7 days
- `month` — current calendar month (default)

## Step 1: Query Usage Data

Using the Supabase MCP, run these queries against the Marketing Supabase project:

### Overall Spending
```sql
SELECT
  COALESCE(SUM(estimated_cost_usd), 0) as total_cost,
  COUNT(*) as total_calls,
  COALESCE(SUM(input_tokens), 0) as total_input_tokens,
  COALESCE(SUM(output_tokens), 0) as total_output_tokens
FROM mkt_usage_logs
WHERE created_at >= <start_of_period>
```

### By Model
```sql
SELECT
  model,
  COUNT(*) as calls,
  COALESCE(SUM(estimated_cost_usd), 0) as cost,
  COALESCE(SUM(input_tokens), 0) as input_tokens,
  COALESCE(SUM(output_tokens), 0) as output_tokens
FROM mkt_usage_logs
WHERE created_at >= <start_of_period>
GROUP BY model
ORDER BY cost DESC
```

### By Day
```sql
SELECT
  DATE(created_at) as day,
  COALESCE(SUM(estimated_cost_usd), 0) as daily_cost,
  COUNT(*) as daily_calls
FROM mkt_usage_logs
WHERE created_at >= <start_of_period>
GROUP BY DATE(created_at)
ORDER BY day DESC
```

### By Operation
```sql
SELECT
  operation,
  COUNT(*) as calls,
  COALESCE(SUM(estimated_cost_usd), 0) as cost
FROM mkt_usage_logs
WHERE created_at >= <start_of_period>
GROUP BY operation
ORDER BY cost DESC
```

## Step 2: Budget Comparison

- Monthly budget limit: $500/user (from `lib/budget-guard.ts`)
- Total Google Cloud credit: $25,000

Calculate:
- Percentage of monthly budget used
- Projected monthly spend (daily average * 30)
- Remaining Google Cloud credit (approximate)

## Step 3: Output Format

```
💰 AI Maliyet Raporu (<period>)

## Toplam Harcama
$X.XX / $500.00 aylik butce (%Y)
Toplam API cagri: Z

## Model Bazinda
| Model | Cagri | Maliyet | Input Tokens | Output Tokens |
|-------|-------|---------|--------------|---------------|
| gemini-2.5-pro | X | $Y.YY | Z | W |

## Gunluk Trend
| Tarih | Maliyet | Cagri |
|-------|---------|-------|

## Operasyon Bazinda
| Operasyon | Cagri | Maliyet |
|-----------|-------|---------|

## Projeksiyon
- Tahmini aylik: $X.XX
- Kalan Google Cloud kredi: ~$X.XX / $25,000

<If > 75% budget>
⚠️ UYARI: Aylik butcenin %X'i kullanildi!
</If>
```
