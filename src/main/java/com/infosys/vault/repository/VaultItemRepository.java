package com.infosys.vault.repository;

import com.infosys.vault.model.Category;
import com.infosys.vault.model.VaultItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaultItemRepository extends JpaRepository<VaultItem, String> {
    List<VaultItem> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<VaultItem> findByUserIdAndCategoryOrderByUpdatedAtDesc(Long userId, Category category);
    List<VaultItem> findByUserIdAndFavoriteOrderByUpdatedAtDesc(Long userId, boolean favorite);
    List<VaultItem> findByUserIdAndCategoryAndFavoriteOrderByUpdatedAtDesc(Long userId, Category category, boolean favorite);
    Optional<VaultItem> findByIdAndUserId(String id, Long userId);
}
