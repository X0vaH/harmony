<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId("salon_id")
                ->nullable()
                ->constrained("salons")
                ->onDelete('cascade');
            $table->foreignId("user_id")
                ->constrained("users")
                ->onDelete('restrict');
            $table->foreignId("dm_id")
                ->nullable()
                ->constrained("dms")
                ->onDelete('restrict');
            $table->longText("contenu");
            $table->dateTime("date");
            $table->longText("public_key")
            ->nullable()
            ->default(null);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
