import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data, error } = await supabase.from('documents').insert({
    project_id: '123e4567-e89b-12d3-a456-426614174000',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    type: 'TEST_DOC',
    title: 'Test',
  });
  console.log("Insert result:", error ? error.message : "Success");
}
run();
