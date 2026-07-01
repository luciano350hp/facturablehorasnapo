# FreelanceTrack — Modelo de datos (DER)

Modelo recomendado para cuando se migre de `localStorage` a base de datos (Lovable Cloud / Postgres).

## Modelo simple (recomendado para v1)

```mermaid
erDiagram
  USERS ||--o{ CLIENTS : "tiene"
  CLIENTS ||--o{ TIME_ENTRIES : "registra"
  CLIENTS ||--o{ WORD_JOBS : "registra"

  USERS {
    uuid id PK
    text email
    text profile_name
    text currency
  }

  CLIENTS {
    uuid id PK
    uuid user_id FK
    text name
    text type "hour | word"
    numeric rate
    text pricing_mode "auto | manual (solo word)"
    int repetition_discount "% (solo word)"
    timestamptz created_at
  }

  TIME_ENTRIES {
    uuid id PK
    uuid client_id FK
    date date
    int minutes
    text kind "billable | planning"
    text note
    timestamptz created_at
  }

  WORD_JOBS {
    uuid id PK
    uuid client_id FK
    date date
    text title
    int total_words
    int repeated_words
    numeric priced_amount
    timestamptz created_at
  }
```

## Modelo con facturas (post-MVP)

Agrega historial inmutable, numeración y estados de cobro.

```mermaid
erDiagram
  USERS ||--o{ CLIENTS : "tiene"
  CLIENTS ||--o{ TIME_ENTRIES : "registra"
  CLIENTS ||--o{ WORD_JOBS : "registra"
  CLIENTS ||--o{ INVOICES : "factura"
  INVOICES ||--o{ INVOICE_ITEMS : "contiene"

  INVOICES {
    uuid id PK
    uuid client_id FK
    text number "INV-2026-0001"
    date issued_at
    date period_start
    date period_end
    numeric total
    text status "draft | sent | paid | void"
  }

  INVOICE_ITEMS {
    uuid id PK
    uuid invoice_id FK
    text kind "hour | word | extra"
    text description
    numeric quantity
    numeric unit_price
    numeric subtotal
    uuid source_entry_id "ref opcional a time_entries/word_jobs"
  }
```

## Notas

- En el modelo simple no existen `invoices` / `invoice_items`. El "tarifario PDF" se calcula al vuelo desde `time_entries` + `word_jobs` filtrando por mes.
- `invoice_items` (renglones de factura) solo se necesita cuando querés congelar lo facturado (que no cambie si después editás horas) y manejar estados de cobro.
