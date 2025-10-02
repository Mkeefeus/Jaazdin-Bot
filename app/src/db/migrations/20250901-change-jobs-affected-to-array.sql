-- Step 1: Add the new column with ARRAY type
ALTER TABLE "boats" ADD COLUMN "jobs_affected_temp" TEXT[] DEFAULT '{}';

-- Step 2: Convert existing JSON data to array format
UPDATE "boats" 
SET "jobs_affected_temp" = CASE 
  WHEN "jobs_affected" IS NULL THEN '{}'
  WHEN jsonb_typeof("jobs_affected"::jsonb) = 'array' THEN 
    ARRAY(SELECT jsonb_array_elements_text("jobs_affected"::jsonb))
  ELSE '{}'
END
WHERE "jobs_affected" IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE "boats" DROP COLUMN "jobs_affected";

-- Step 4: Rename the temporary column
ALTER TABLE "boats" RENAME COLUMN "jobs_affected_temp" TO "jobs_affected";