<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'name' => 'Eddi',
                'password' => Hash::make('Eddi1234'),
                'light_mode' => true,
                'is_admin' => true,
                'language' => 'fr',
            ],
            [
                'name' => 'Admin',
                'password' => Hash::make('Admin1234'),
                'light_mode' => true,
                'is_admin' => true,
                'language' => 'fr',
            ],
            [
                'name' => 'User',
                'password' => Hash::make('User1234'),
                'light_mode' => true,
                'is_admin' => false,
                'language' => 'fr',
            ],
            [
                'name' => 'Dark User',
                'password' => Hash::make('Darkuser1234'),
                'light_mode' => false,
                'is_admin' => false,
                'language' => 'fr',
            ],
            [
                'name' => 'English User',
                'password' => Hash::make('Englishuser1234'),
                'light_mode' => true,
                'is_admin' => false,
                'language' => 'en',
            ],
            [
                'name' => 'dumdum',
                'password' => Hash::make('Dumdum1234'),
                'light_mode' => true,
                'is_admin' => false,
                'language' => 'en',
            ]
        ]);
    }
}
