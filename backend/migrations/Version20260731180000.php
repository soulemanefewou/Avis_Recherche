<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260731180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le champ fcm_token à la table utilisateur.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE utilisateur ADD fcm_token VARCHAR(500) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE utilisateur DROP fcm_token');
    }
}
