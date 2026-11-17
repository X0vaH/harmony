<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class salon_members extends Model
{
    use HasFactory;
    protected $fillable = ['salon_id', 'user_id'];

}
