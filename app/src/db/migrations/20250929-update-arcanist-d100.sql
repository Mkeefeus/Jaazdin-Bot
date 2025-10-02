UPDATE job_tiers
SET bonus = 'Gain training points at the university equal to your Job Tier, or make an Arcana check and gain gold equal to your check plus your job Tier.'
WHERE job_id = 12 AND roll_min = 86 AND roll_max = 95;
UPDATE job_tiers
SET bonus = 'Gain training points at the university equal to twice your Job Tier, or make an Arcana check and gain gold equal to twice your check plus your job Tier.'
WHERE job_id = 12 AND roll_min = 136 AND roll_max = 300;