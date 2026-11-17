<?php

namespace App\Console\Commands;

use App\Events\Heartbeat;
use App\Events\PresenceEnvoye;
use App\Events\UserTyping;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use App\Events\MessageEnvoye; // ShouldBroadcastNow

class RedisPubSub extends Command
{
    /**
     * USAGE (patterns uniquement):
     *   php artisan bridge:sub dm.* salon.* heartbeat.*
     */
    protected $signature   = 'bridge:sub {patterns* : Redis channel patterns (ex: dm.* salon.* heartbeat.*)}';
    protected $description = 'PSUBSCRIBE to Redis patterns and re-broadcast to Reverb (no SUBSCRIBE, no wildcard detection)';

    public function handle(): int
    {
        $patterns = (array) $this->argument('patterns');

        $this->banner('PSUBSCRIBE -> '.implode(' ', $patterns));
        Log::info('[Bridge:SUB] start', ['patterns' => $patterns]);

        while (true) {
            try {
                Redis::connection('pubsub')->psubscribe($patterns, function ($message, $channel) {
                    $this->handleMessage($channel, $message);
                });
            } catch (\Throwable $e) {
                $this->error('PubSub dropped: '.$e->getMessage());
                Log::error('[Bridge:SUB] dropped', ['err' => $e->getMessage()]);

            }
            sleep(1);
        }
    }

    private function handleMessage(string $channel, $message): void
    {
        Log::debug('[Bridge:SUB] recv', ['channel' => $channel, 'message' => $message]);

        try {
            $msg = json_decode($message, true);

            $preview = substr(json_encode($msg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 0, 140);
            $this->info("REBROADCAST {$channel} -> id=".($msg['id'] ?? 'n/a')." | {$preview}...");
            Log::info('[Bridge:SUB] Rebroadcast', ['channel'=>$channel, 'id'=>$msg['id'] ?? null]);

            $type = $msg['type'] ?? null;

            switch ($type) {
                case 'message':
                    event(new MessageEnvoye($msg));
                    return;

                case 'presence':
                    event(new PresenceEnvoye($msg));
                    return;

                case 'typing':
                    event(new UserTyping($msg));
                    return;
                case 'heartbeat':
                    Log::info('[Bridge:SUB] heartbeat', ['channel'=>$channel]);
                    return;
                default:
                    return;
            }


        } catch (\Throwable $e) {
            $this->warn('Handler error: '.$e->getMessage());
            Log::error('[Bridge:SUB] handler error', ['err' => $e->getMessage()]);
        }
    }

    private function banner(string $text): void
    {
        $bar = str_repeat('=', max(30, strlen($text) + 6));
        $this->line("\n<info>{$bar}</info>");
        $this->line("<info>  {$text}  </info>");
        $this->line("<info>{$bar}</info>\n");
    }
}
