
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wamcybyhcbywdyykrfrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbWN5YnloY2J5d2R5eWtyZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTc5MTUsImV4cCI6MjA4NjQzMzkxNX0.FhIWUzjnfe9Gssrjl93_KE3v1ERgIctwmQtoomy1reE';

const supabase = createClient(supabaseUrl, supabaseKey);

const fs = require('fs');

async function inspect() {
    console.log('--- Inspecting Supabase Schema ---');

    const candidateTables = [
        'cargas',
        'paquetes',
        'detalles_paquete',
        'vista_paquetes_completos'
    ];

    const results = {};

    for (const table of candidateTables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);

            if (!error) {
                if (data && data.length > 0) {
                    results[table] = data[0];
                    console.log(`✅ Found table: "${table}"`);
                } else {
                    results[table] = 'Empty table';
                    console.log(`⚠️ Found table: "${table}" (Empty)`);
                }
            }
        } catch (e) {
            // ignore
        }
    }

    fs.writeFileSync('schema.json', JSON.stringify(results, null, 2));
    console.log('Schema dump written to schema.json');
}

inspect();
