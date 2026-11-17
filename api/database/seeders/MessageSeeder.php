<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('messages')->insert([
            [
                'salon_id' => null,
                'user_id' => 1,
                'dm_id' => 1,
                'contenu' => "Bonjour, ceci est un test.",
                'date' => now(),
                'public_key' => null
            ],
            [
                'salon_id' => 1,
                'user_id' => 1,
                'dm_id' => null,
                'contenu' => "Comment ca va ??",
                'date' => now(),
                'public_key' => null // Ajout de la clé manquante
            ],
            [
                'salon_id' => null,
                'user_id' => 3,
                'dm_id' => 1,
                'contenu' => "Bonjour, ceci est un test.",
                'date' => now(),
                'public_key' => null
            ],
            [
                'salon_id' => null,
                'user_id' => 1,
                'dm_id' => 1,
                'contenu' => "Bonjour, ceci est un test.2",
                'date' => now(),
                'public_key' => null
            ],
            [
                'salon_id' => null,
                'user_id' => 1,
                'dm_id' => 1,
                'contenu' => "Bonjour, ceci est un test.3",
                'date' => now(),
                'public_key' => null
            ],
            [
                'salon_id' => null,
                'user_id' => 3,
                'dm_id' => 1,
                'contenu' => "Bonjour, ceci est un test.",
                'date' => now(),
                'public_key' => null
            ],
        ]);
    }
}
