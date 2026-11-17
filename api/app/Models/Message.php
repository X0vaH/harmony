<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;
    protected $fillable = ['contenu', 'user_id', 'salon_id', 'date', 'dm_id', "public_key" ];

    public function dm()
    {
        return $this->belongsTo(Dm::class);
    }

    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
