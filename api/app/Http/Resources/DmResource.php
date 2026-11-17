<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DmResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'        => $this->id,
            'user_id1'  => $this->user_id1,
            'user_id2'  => $this->user_id2,
        ];
    }
}
