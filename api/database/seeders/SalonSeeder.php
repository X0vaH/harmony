<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('salons')->insert([
            ['name' => 'General', 'is_private' => false],
            ['name' => 'Announcements', 'is_private' => false],
            ['name' => 'Development', 'is_private' => true],
            ['name' => 'Support', 'is_private' => false],
            ['name' => 'Off Topic', 'is_private' => false],
        ]);
    }
}
