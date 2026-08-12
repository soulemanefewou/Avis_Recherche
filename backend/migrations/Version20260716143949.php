<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260716143949 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE avis_recherche (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, prenom VARCHAR(100) NOT NULL, sexe VARCHAR(255) NOT NULL, age_approx INT NOT NULL, date_disparition DATETIME NOT NULL, dernier_lieu_vu VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, tenue_vestimentaire LONGTEXT DEFAULT NULL, signes_particuliers LONGTEXT DEFAULT NULL, taille DOUBLE PRECISION DEFAULT NULL, poids DOUBLE PRECISION DEFAULT NULL, statut VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, utilisateur_id INT NOT NULL, region_id INT NOT NULL, ville_id INT NOT NULL, INDEX IDX_12720487FB88E14F (utilisateur_id), INDEX IDX_1272048798260155 (region_id), INDEX IDX_12720487A73F0036 (ville_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE commissariat (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, adresse VARCHAR(255) NOT NULL, telephone VARCHAR(20) NOT NULL, email VARCHAR(255) NOT NULL, responsable VARCHAR(255) NOT NULL, actif TINYINT NOT NULL, utilisateur_id INT NOT NULL, region_id INT NOT NULL, ville_id INT NOT NULL, UNIQUE INDEX UNIQ_F87ED495FB88E14F (utilisateur_id), INDEX IDX_F87ED49598260155 (region_id), INDEX IDX_F87ED495A73F0036 (ville_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE conversation (id INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, avis_recherche_id INT NOT NULL, createur_signalement_id INT NOT NULL, proprietaire_avis_id INT NOT NULL, INDEX IDX_8A8E26E9585C1D33 (avis_recherche_id), INDEX IDX_8A8E26E9565114B3 (createur_signalement_id), INDEX IDX_8A8E26E9D3E6A186 (proprietaire_avis_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE message (id INT AUTO_INCREMENT NOT NULL, contenu LONGTEXT NOT NULL, created_at DATETIME NOT NULL, lu TINYINT NOT NULL, type VARCHAR(255) NOT NULL, conversation_id INT NOT NULL, auteur_id INT DEFAULT NULL, INDEX IDX_B6BD307F9AC0396 (conversation_id), INDEX IDX_B6BD307F60BB6FE6 (auteur_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, titre VARCHAR(255) NOT NULL, contenu LONGTEXT NOT NULL, type VARCHAR(50) NOT NULL, lu TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, utilisateur_id INT NOT NULL, INDEX IDX_BF5476CAFB88E14F (utilisateur_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE photo (id INT AUTO_INCREMENT NOT NULL, nom_original VARCHAR(255) NOT NULL, nom_fichier VARCHAR(255) NOT NULL, chemin VARCHAR(255) NOT NULL, mime_type VARCHAR(255) NOT NULL, taille INT NOT NULL, est_principale TINYINT NOT NULL, created_at DATETIME NOT NULL, avis_recherche_id INT NOT NULL, INDEX IDX_14B78418585C1D33 (avis_recherche_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE region (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, code VARCHAR(10) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE signalement (id INT AUTO_INCREMENT NOT NULL, description LONGTEXT NOT NULL, lieu VARCHAR(255) NOT NULL, date_observation DATETIME NOT NULL, telephone_contact VARCHAR(30) NOT NULL, statut VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, utilisateur_id INT NOT NULL, avis_recherche_id INT NOT NULL, INDEX IDX_F4B55114FB88E14F (utilisateur_id), INDEX IDX_F4B55114585C1D33 (avis_recherche_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE utilisateur (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, prenom VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, telephone VARCHAR(20) NOT NULL, photo_profil VARCHAR(255) DEFAULT NULL, actif TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, password VARCHAR(255) NOT NULL, roles JSON NOT NULL, UNIQUE INDEX UNIQ_1D1C63B3E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE ville (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, region_id INT NOT NULL, INDEX IDX_43C3D9C398260155 (region_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE avis_recherche ADD CONSTRAINT FK_12720487FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE avis_recherche ADD CONSTRAINT FK_1272048798260155 FOREIGN KEY (region_id) REFERENCES region (id)');
        $this->addSql('ALTER TABLE avis_recherche ADD CONSTRAINT FK_12720487A73F0036 FOREIGN KEY (ville_id) REFERENCES ville (id)');
        $this->addSql('ALTER TABLE commissariat ADD CONSTRAINT FK_F87ED495FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE commissariat ADD CONSTRAINT FK_F87ED49598260155 FOREIGN KEY (region_id) REFERENCES region (id)');
        $this->addSql('ALTER TABLE commissariat ADD CONSTRAINT FK_F87ED495A73F0036 FOREIGN KEY (ville_id) REFERENCES ville (id)');
        $this->addSql('ALTER TABLE conversation ADD CONSTRAINT FK_8A8E26E9585C1D33 FOREIGN KEY (avis_recherche_id) REFERENCES avis_recherche (id)');
        $this->addSql('ALTER TABLE conversation ADD CONSTRAINT FK_8A8E26E9565114B3 FOREIGN KEY (createur_signalement_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE conversation ADD CONSTRAINT FK_8A8E26E9D3E6A186 FOREIGN KEY (proprietaire_avis_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307F9AC0396 FOREIGN KEY (conversation_id) REFERENCES conversation (id)');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307F60BB6FE6 FOREIGN KEY (auteur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE photo ADD CONSTRAINT FK_14B78418585C1D33 FOREIGN KEY (avis_recherche_id) REFERENCES avis_recherche (id)');
        $this->addSql('ALTER TABLE signalement ADD CONSTRAINT FK_F4B55114FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE signalement ADD CONSTRAINT FK_F4B55114585C1D33 FOREIGN KEY (avis_recherche_id) REFERENCES avis_recherche (id)');
        $this->addSql('ALTER TABLE ville ADD CONSTRAINT FK_43C3D9C398260155 FOREIGN KEY (region_id) REFERENCES region (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE avis_recherche DROP FOREIGN KEY FK_12720487FB88E14F');
        $this->addSql('ALTER TABLE avis_recherche DROP FOREIGN KEY FK_1272048798260155');
        $this->addSql('ALTER TABLE avis_recherche DROP FOREIGN KEY FK_12720487A73F0036');
        $this->addSql('ALTER TABLE commissariat DROP FOREIGN KEY FK_F87ED495FB88E14F');
        $this->addSql('ALTER TABLE commissariat DROP FOREIGN KEY FK_F87ED49598260155');
        $this->addSql('ALTER TABLE commissariat DROP FOREIGN KEY FK_F87ED495A73F0036');
        $this->addSql('ALTER TABLE conversation DROP FOREIGN KEY FK_8A8E26E9585C1D33');
        $this->addSql('ALTER TABLE conversation DROP FOREIGN KEY FK_8A8E26E9565114B3');
        $this->addSql('ALTER TABLE conversation DROP FOREIGN KEY FK_8A8E26E9D3E6A186');
        $this->addSql('ALTER TABLE message DROP FOREIGN KEY FK_B6BD307F9AC0396');
        $this->addSql('ALTER TABLE message DROP FOREIGN KEY FK_B6BD307F60BB6FE6');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAFB88E14F');
        $this->addSql('ALTER TABLE photo DROP FOREIGN KEY FK_14B78418585C1D33');
        $this->addSql('ALTER TABLE signalement DROP FOREIGN KEY FK_F4B55114FB88E14F');
        $this->addSql('ALTER TABLE signalement DROP FOREIGN KEY FK_F4B55114585C1D33');
        $this->addSql('ALTER TABLE ville DROP FOREIGN KEY FK_43C3D9C398260155');
        $this->addSql('DROP TABLE avis_recherche');
        $this->addSql('DROP TABLE commissariat');
        $this->addSql('DROP TABLE conversation');
        $this->addSql('DROP TABLE message');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE photo');
        $this->addSql('DROP TABLE region');
        $this->addSql('DROP TABLE signalement');
        $this->addSql('DROP TABLE utilisateur');
        $this->addSql('DROP TABLE ville');
    }
}
