import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the products schema SQL file
    const sqlFilePath = path.join(process.cwd(), 'database', 'products-schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    const results = [];
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('insert into')) {
        // For insert statements, we'll handle them specially
        console.log('Executing statement:', statement.substring(0, 100) + '...');
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        });
        
        if (error) {
          console.error('Error executing statement:', error);
          results.push({ statement: statement.substring(0, 100), error: error.message });
        } else {
          results.push({ statement: statement.substring(0, 100), success: true });
        }
      } catch (err: any) {
        console.error('Exception executing statement:', err);
        results.push({ statement: statement.substring(0, 100), error: err.message });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Products schema execution completed',
      results 
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
}
