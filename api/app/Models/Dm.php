<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dm extends Model
{
   protected $fillable = ['user_id1', 'user_id2'];

   public function users()
   {
       return $this->hasMany(User::class);
   }
}
