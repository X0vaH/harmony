<?php

namespace App\Console;

use App\Console\Commands\RedisPubSub;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Enregistrement explicite des commandes Artisan.
     */
    protected $commands = [
        RedisPubSub::class,
    ];
    /**
     * Chargement des commandes (auto + routes/console.php).
     */
    protected function commands(): void
    {
        // Charge toutes les classes dans app/Console/Commands
        $this->load(__DIR__.'/Commands');

        // Charge les closures de routes/console.php (facultatif)
        require base_path('routes/console.php');
    }
}
