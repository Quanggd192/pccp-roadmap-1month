const { readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

const projectDirectory = path.join(__dirname, "..");
const dataPath = path.join(projectDirectory, "week2_data.json");
const outputPath = path.join(projectDirectory, "supabase_week2_migration.sql");

async function main() {
  const week2 = JSON.parse(await readFile(dataPath, "utf8"));
  const seed = JSON.stringify(week2);
  const sql = `-- Add Week 2 and namespace existing Week 1 progress keys.
-- Safe to run more than once. Existing Week 2 checklist data is preserved.

begin;

with source as (
  select
    id,
    document,
    coalesce(document -> 'progress', '{}'::jsonb) as progress
  from public.pccp_databases
  where id = 'week1'
),
migrated as (
  select
    id,
    case
      when jsonb_typeof(document #> '{checklists,week2}') = 'array'
        then document #> '{checklists,week2}'
      else $week2_json$${seed}$week2_json$::jsonb
    end as week2,
    coalesce((
      select jsonb_object_agg(
        case when key like 'week-%' then key else 'week-1-' || key end,
        value
      )
      from jsonb_each(coalesce(progress -> 'checked', '{}'::jsonb))
    ), '{}'::jsonb) as checked,
    coalesce((
      select jsonb_object_agg(
        case when key like 'week-%' then key else 'week-1-day-' || key end,
        value
      )
      from jsonb_each(coalesce(progress -> 'notes', '{}'::jsonb))
    ), '{}'::jsonb) as notes,
    coalesce((
      select jsonb_object_agg(
        case when key like 'week-%' then key else 'week-1-' || key end,
        value
      )
      from jsonb_each(coalesce(progress -> 'sampleCodes', '{}'::jsonb))
    ), '{}'::jsonb) as sample_codes,
    coalesce((
      select jsonb_agg(
        case
          when jsonb_typeof(value) = 'object' and not (value ? 'week')
            then value || '{"week":1}'::jsonb
          else value
        end
      )
      from jsonb_array_elements(coalesce(progress -> 'errors', '[]'::jsonb))
    ), '[]'::jsonb) as errors
  from source
)
update public.pccp_databases as database
set document = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              database.document,
              '{checklists,week2}', migrated.week2, true
            ),
            '{progress,checked}', migrated.checked, true
          ),
          '{progress,notes}', migrated.notes, true
        ),
        '{progress,sampleCodes}', migrated.sample_codes, true
      ),
      '{progress,errors}', migrated.errors, true
    ),
    '{progress,week2Mock}',
    coalesce(database.document #> '{progress,week2Mock}',
      '{"score":"","solved":"","minutes":"","weak":""}'::jsonb),
    true
  ),
  '{progress,week2OpenDays}',
  coalesce(database.document #> '{progress,week2OpenDays}', '[1]'::jsonb),
  true
)
from migrated
where database.id = migrated.id;

alter table public.pccp_databases
  drop constraint if exists pccp_databases_week2_is_array;

alter table public.pccp_databases
  add constraint pccp_databases_week2_is_array
  check (jsonb_typeof(document #> '{checklists,week2}') = 'array');

commit;

-- Verification:
-- select
--   jsonb_array_length(document #> '{checklists,week1}') as week1_days,
--   jsonb_array_length(document #> '{checklists,week2}') as week2_days,
--   jsonb_object_length(document #> '{progress,checked}') as checked_items,
--   document #> '{progress,errors}' as error_log
-- from public.pccp_databases
-- where id = 'week1';
`;

  await writeFile(outputPath, sql, "utf8");
  console.log(`Generated ${path.basename(outputPath)} with ${week2.length} days.`);
}

main().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
