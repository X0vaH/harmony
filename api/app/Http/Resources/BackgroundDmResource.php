<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BackgroundDmResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'        => $this->id,
            'couleur'  => $this->couleur,
            'dm_id'  => $this->dm_id,
        ];
    }
}
