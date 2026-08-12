<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260720142823 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conversation ADD updated_at DATETIME NOT NULL, ADD last_message_at DATETIME NOT NULL');
        $this->addSql('CREATE UNIQUE INDEX uniq_conversation_utilisateurs_avis ON conversation (avis_recherche_id, createur_signalement_id, proprietaire_avis_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX uniq_conversation_utilisateurs_avis ON conversation');
        $this->addSql('ALTER TABLE conversation DROP updated_at, DROP last_message_at');
    }
}
