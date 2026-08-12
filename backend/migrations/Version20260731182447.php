<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260731182447 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE signalement ADD urgent TINYINT NOT NULL DEFAULT 0');
        $this->addSql('ALTER TABLE utilisateur ADD region_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE utilisateur ADD CONSTRAINT FK_1D1C63B398260155 FOREIGN KEY (region_id) REFERENCES region (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_1D1C63B398260155 ON utilisateur (region_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE signalement DROP urgent');
        $this->addSql('ALTER TABLE utilisateur DROP FOREIGN KEY FK_1D1C63B398260155');
        $this->addSql('DROP INDEX IDX_1D1C63B398260155 ON utilisateur');
        $this->addSql('ALTER TABLE utilisateur DROP region_id');
    }
}
