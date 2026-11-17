<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class Salon_membersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('salon_members')->insert([
            ['salon_id' => 1,
            'user_id' => 1],
            ['salon_id' => 1,
            'user_id' => 2],
            ['salon_id' => 1,
            'user_id' => 3],
            ['salon_id' => 2,
            'user_id' => 1],
            ['salon_id' => 2,
            'user_id' => 4],
            ['salon_id' => 3,
            'user_id' => 1],
            ['salon_id' => 3,
            'user_id' => 2],
            ['salon_id' => 3,
            'user_id' => 5],
            ['salon_id' => 4,
            'user_id' => 3],
            ['salon_id' => 4,
            'user_id' => 1],
            ['salon_id' => 5,
            'user_id' => 1]
        ]);
    }
}
