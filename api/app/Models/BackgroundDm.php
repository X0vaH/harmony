<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackgroundDm extends Model
{
   protected $fillable = ['couleur', 'dm_id'];

    public function dm()
    {
        return $this->hasMany(Dm::class);
    }
}
