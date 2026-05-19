import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fefbcitdvdfiiglfrrch.supabase.co";
const supabaseAnonKey = "sb_publishable_SByBij5fz9LK2BrX70nWnQ_0syWPhs5";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // Let's find one row first
  const { data: rows, error: fetchErr } = await supabase.from('modul_ajar').select('*').limit(1);
  if (fetchErr || rows.length === 0) {
    console.error("Error fetching or no rows:", fetchErr);
    return;
  }
  
  const originalRow = rows[0];
  console.log("Original row drive_link:", originalRow.drive_link);
  
  // Try updating the drive_link of this row
  const testLink = "https://drive.google.com/drive/folders/test-" + Date.now();
  console.log("Updating drive_link to:", testLink);
  
  const { data: updatedData, error: updateErr } = await supabase
    .from('modul_ajar')
    .update({ drive_link: testLink })
    .eq('id', originalRow.id)
    .select();
    
  if (updateErr) {
    console.error("Error updating drive_link:", updateErr);
  } else {
    console.log("Success! Updated row:", updatedData[0]);
  }
}

test();
