<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260726013521 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE avis_recherche ADD type VARCHAR(255) NOT NULL, CHANGE commissariat_id commissariat_id INT DEFAULT NULL, CHANGE auteur_id auteur_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE avis_recherche ADD CONSTRAINT FK_12720487CF70E3F3 FOREIGN KEY (commissariat_id) REFERENCES commissariat (id)');
        $this->addSql('ALTER TABLE avis_recherche ADD CONSTRAINT FK_1272048760BB6FE6 FOREIGN KEY (auteur_id) REFERENCES utilisateur (id)');
        $this->addSql('CREATE INDEX IDX_12720487CF70E3F3 ON avis_recherche (commissariat_id)');
        $this->addSql('CREATE INDEX IDX_1272048760BB6FE6 ON avis_recherche (auteur_id)');
        $this->addSql('ALTER TABLE conversation ADD statut VARCHAR(255) NOT NULL, ADD type VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE message ADD signale_par_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307FAE190A20 FOREIGN KEY (signale_par_id) REFERENCES utilisateur (id)');
        $this->addSql('CREATE INDEX IDX_B6BD307FAE190A20 ON message (signale_par_id)');
        $this->addSql('ALTER TABLE utilisateur ADD lieu_residence VARCHAR(255) DEFAULT NULL, CHANGE updated_at updated_at DATETIME NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE avis_recherche DROP FOREIGN KEY FK_12720487CF70E3F3');
        $this->addSql('ALTER TABLE avis_recherche DROP FOREIGN KEY FK_1272048760BB6FE6');
        $this->addSql('DROP INDEX IDX_12720487CF70E3F3 ON avis_recherche');
        $this->addSql('DROP INDEX IDX_1272048760BB6FE6 ON avis_recherche');
        $this->addSql('ALTER TABLE avis_recherche DROP type, CHANGE commissariat_id commissariat_id INT NOT NULL, CHANGE auteur_id auteur_id INT NOT NULL');
        $this->addSql('ALTER TABLE conversation DROP statut, DROP type');
        $this->addSql('ALTER TABLE message DROP FOREIGN KEY FK_B6BD307FAE190A20');
        $this->addSql('DROP INDEX IDX_B6BD307FAE190A20 ON message');
        $this->addSql('ALTER TABLE message DROP signale_par_id');
        $this->addSql('ALTER TABLE utilisateur DROP lieu_residence, CHANGE updated_at updated_at DATETIME DEFAULT NULL');
    }
}
