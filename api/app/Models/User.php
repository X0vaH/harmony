<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;
    protected $fillable = [
        'name',
        'password',
        'light_mode',
        'is_admin',
        'language',
        'get_notifications',
        'estOnline',
    ];

    protected $casts = [
        'light_mode' => 'boolean',
        'is_admin' => 'boolean',
        'get_notifications' => 'boolean',
    ];

    public function sentFriendRequests()
    {
        return $this->hasMany(Friend::class, 'sender_id');
    }

    public function receivedFriendRequests()
    {
        return $this->hasMany(Friend::class, 'receiver_id');
    }

    public function friends()
    {
        return User::whereHas('sentFriendRequests', function ($q) {
            $q->where('status', 'accepted')
                ->where('receiver_id', $this->id);
        })
            ->orWhereHas('receivedFriendRequests', function ($q) {
                $q->where('status', 'accepted')
                    ->where('sender_id', $this->id);
            })
            ->get();
    }
}
