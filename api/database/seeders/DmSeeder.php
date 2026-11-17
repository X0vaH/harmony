<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DmSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('dms')->insert([
            [
                'user_id1' => 1,
                'user_id2' => 3,
            ],
            [
                'user_id1' => 1,
                'user_id2' => 4,
            ],
            [
                'user_id1' => 2,
                'user_id2' => 3,
            ],
            [
                'user_id1' => 2,
                'user_id2' => 5,
            ],
            [
                'user_id1' => 3,
                'user_id2' => 4,
            ],
            [
                'user_id1' => 4,
                'user_id2' => 5,
            ]
        ]);
    }
}
